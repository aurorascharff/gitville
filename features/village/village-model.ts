import { hashString } from '@/lib/utils';
import type { VillagePayload, WireEvent } from '@/types/github';

export const WORLD_W = 2200;
export const WORLD_H = 1560;
const CX = WORLD_W / 2;
const CY = WORLD_H / 2;
const DX = 350;
const DY = 295;

const AXIAL: [number, number][] = [
  [0, 0],
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
  [1, -1],
  [2, 0],
  [1, 1],
  [0, 2],
  [-1, 2],
  [-2, 2],
  [-2, 1],
  [-2, 0],
  [-1, -1],
  [0, -2],
  [1, -2],
  [2, -2],
  [2, -1],
];

function slotPos(i: number): { x: number; y: number } {
  const [q, r] = AXIAL[i % AXIAL.length];
  return { x: CX + (q + r / 2) * DX, y: CY + r * DY };
}

export type CellKind = 'main' | 'pr' | 'branch' | 'issue' | 'inbox';

export type PrState = 'draft' | 'ready' | 'stacked';

export type Cell = {
  id: string;
  kind: CellKind;
  label: string;
  sub: string | null;
  url: string;
  draft?: boolean;
  prState?: PrState;
  floors?: number;
  stackedOn?: number;
  author?: string;
  ref?: string;
  baseRef?: string;
  // A stack is one building: only the top PR renders; members keep invisible cells at the same spot.
  hidden?: boolean;
  x: number;
  y: number;
};

function stackDepth(pr: VillagePayload['prs'][number], byHead: Map<string, VillagePayload['prs'][number]>): number {
  let depth = 1;
  const seen = new Set<number>([pr.number]);
  let parent = byHead.get(pr.baseRef);
  while (parent && !seen.has(parent.number)) {
    depth += 1;
    seen.add(parent.number);
    parent = byHead.get(parent.baseRef);
  }
  return depth;
}

export function pickedPrs(payload: VillagePayload): VillagePayload['prs'] {
  return payload.prs.slice(0, 14);
}

export function buildCells(payload: VillagePayload, slug: string, asOf = Number.POSITIVE_INFINITY): Cell[] {
  const cells: Cell[] = [];
  let slot = 0;

  cells.push({
    id: 'main',
    kind: 'main',
    label: payload.defaultBranch,
    sub: 'default branch',
    url: `https://github.com/${slug}`,
    ...slotPos(slot++),
  });

  const prNumbers = new Set(payload.prs.map(pr => pr.number));
  const byHead = new Map(payload.prs.filter(pr => pr.branch).map(pr => [pr.branch, pr]));
  const baseRefs = new Set(payload.prs.map(pr => pr.baseRef));
  const picked = pickedPrs(payload);
  const tops = picked.filter(pr => !baseRefs.has(pr.branch));
  const placed = new Set<number>();

  for (const pr of tops) {
    const floors = stackDepth(pr, byHead);
    const under = byHead.get(pr.baseRef);
    const pos = slotPos(slot++);
    placed.add(pr.number);
    cells.push({
      id: `pr:${pr.number}`,
      kind: 'pr',
      label: `#${pr.number}`,
      sub: pr.title,
      url: pr.url,
      draft: pr.draft,
      prState: floors > 1 ? 'stacked' : pr.draft ? 'draft' : 'ready',
      floors,
      stackedOn: under?.number,
      author: pr.author,
      ref: pr.branch,
      baseRef: pr.baseRef,
      ...pos,
    });
    let cur = pr;
    for (;;) {
      const parent = byHead.get(cur.baseRef);
      if (!parent || placed.has(parent.number)) break;
      placed.add(parent.number);
      cells.push({
        id: `pr:${parent.number}`,
        kind: 'pr',
        label: `#${parent.number}`,
        sub: parent.title,
        url: parent.url,
        draft: parent.draft,
        prState: 'stacked',
        floors: stackDepth(parent, byHead),
        stackedOn: byHead.get(parent.baseRef)?.number,
        author: parent.author,
        ref: parent.branch,
        baseRef: parent.baseRef,
        hidden: true,
        ...pos,
      });
      cur = parent;
    }
  }

  // Scrubbing back reopens houses closed after the viewed moment.
  if (Number.isFinite(asOf)) {
    const past = new Map<number, WireEvent>();
    for (const e of payload.events) {
      if (e.kind !== 'pr_merged' && e.kind !== 'pr_closed') continue;
      if (e.number == null || prNumbers.has(e.number)) continue;
      if (new Date(e.at).getTime() <= asOf) continue;
      if (!past.has(e.number)) past.set(e.number, e);
    }
    for (const [number, e] of past) {
      if (slot >= 17) break;
      cells.push({
        id: `pr:${number}`,
        kind: 'pr',
        label: `#${number}`,
        sub: e.detail,
        url: e.url ?? `https://github.com/${slug}/pull/${number}`,
        prState: 'ready',
        floors: 1,
        author: e.actor,
        ...slotPos(slot++),
      });
    }
  }

  const prRefs = new Set(payload.prs.map(pr => pr.branch));
  for (const b of payload.branches.filter(b => !prRefs.has(b.ref)).slice(0, 5)) {
    if (slot >= 18) break;
    cells.push({
      id: `branch:${b.ref}`,
      kind: 'branch',
      label: b.ref.split('/').pop() ?? b.ref,
      sub: b.ref,
      url: `https://github.com/${slug}/tree/${encodeURIComponent(b.ref)}`,
      ...slotPos(slot++),
    });
  }

  // Numbered activity for items outside the open-PR window. A number is a PR if
  // any of its events say so (a PR comment arrives as an IssueCommentEvent, so
  // trust e.isPr over the kind); otherwise it's a real issue.
  const activity = new Map<number, { count: number; title: string | null; isPr: boolean }>();
  for (const e of payload.events) {
    if (e.number == null || prNumbers.has(e.number)) continue;
    const cur = activity.get(e.number) ?? { count: 0, title: null, isPr: false };
    cur.count += 1;
    if (!cur.title && e.detail) cur.title = e.detail;
    if (e.isPr) cur.isPr = true;
    activity.set(e.number, cur);
  }
  const topActivity = [...activity.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [number, info] of topActivity) {
    if (slot >= 18) break;
    // Merged/closed PRs may already have a house from the scrub-reopen pass.
    if (cells.some(c => c.id === `pr:${number}` || c.id === `issue:${number}`)) continue;
    cells.push(
      info.isPr
        ? {
            id: `pr:${number}`,
            kind: 'pr',
            label: `#${number}`,
            sub: info.title,
            url: `https://github.com/${slug}/pull/${number}`,
            prState: 'ready',
            floors: 1,
            ...slotPos(slot++),
          }
        : {
            id: `issue:${number}`,
            kind: 'issue',
            label: `#${number}`,
            sub: info.title,
            url: `https://github.com/${slug}/issues/${number}`,
            ...slotPos(slot++),
          },
    );
  }

  cells.push({
    id: 'inbox',
    kind: 'inbox',
    label: 'town square',
    sub: 'passing through',
    url: `https://github.com/${slug}/issues`,
    ...slotPos(slot++),
  });

  return cells;
}

export function cellForEvent(e: WireEvent, cells: Cell[], defaultBranch: string): string {
  if (e.ref) {
    if (e.ref === defaultBranch) return 'main';
    const pr = cells.find(c => c.kind === 'pr' && c.ref === e.ref);
    if (pr) return pr.id;
    return cells.some(c => c.id === `branch:${e.ref}`) ? `branch:${e.ref}` : 'inbox';
  }
  if (e.number != null) {
    if (cells.some(c => c.id === `pr:${e.number}`)) return `pr:${e.number}`;
    if (cells.some(c => c.id === `issue:${e.number}`)) return `issue:${e.number}`;
    return 'inbox';
  }
  if (e.kind === 'release') return 'main';
  return 'inbox';
}

export type Actor = {
  login: string;
  avatar: string | null;
  cellId: string;
  event: WireEvent;
};

export function actorsAt(payload: VillagePayload, cells: Cell[], t: number): Actor[] {
  const byActor = new Map<string, WireEvent>();
  for (const e of payload.events) {
    if (e.actor.endsWith('[bot]')) continue;
    if (new Date(e.at).getTime() > t) continue;
    const prev = byActor.get(e.actor);
    if (!prev || new Date(e.at).getTime() > new Date(prev.at).getTime()) byActor.set(e.actor, e);
  }

  return [...byActor.values()]
    .map(event => ({
      login: event.actor,
      avatar: event.avatar,
      cellId: cellForEvent(event, cells, payload.defaultBranch),
      event,
    }))
    .sort((a, b) => a.login.localeCompare(b.login));
}

export function arcOffset(index: number, count: number): { x: number; y: number } {
  let ring = 0;
  let start = 0;
  let cap = 6;
  while (index >= start + cap) {
    start += cap;
    ring += 1;
    cap = 6 + ring * 4;
  }
  const inRing = index - start;
  const ringCount = Math.min(count - start, cap);
  const startDeg = 25;
  const endDeg = 155;
  const step = (endDeg - startDeg) / (ringCount + 1);
  const deg = startDeg + step * (inRing + 1);
  const radius = 80 + ring * 40;
  const rad = (deg * Math.PI) / 180;
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius * 0.92 };
}

export function hashDelay(login: string): number {
  return hashString(login) % 2000;
}

export type Room = {
  commits: WireEvent[];
  notes: WireEvent[];
  size: 'S' | 'M' | 'L';
  theme: string;
};

const THEMES: [RegExp, string][] = [
  [/turbo|build|compil|bundl/i, 'Machine Works'],
  [/test|e2e|flake|spec/i, 'Testing Lab'],
  [/doc|readme|guide/i, 'The Library'],
  [/css|style|design|ui\b/i, 'Design Studio'],
  [/cache|memo/i, 'Cold Storage'],
  [/perf|speed|fast|optimi/i, 'Speed Shop'],
  [/fix|bug|repair|patch/i, 'Repair Shop'],
  [/release|publish|ship/i, 'Shipping Dock'],
];

export function roomFor(payload: VillagePayload, cells: Cell[], cellId: string): Room {
  const events = payload.events.filter(e => cellForEvent(e, cells, payload.defaultBranch) === cellId);
  const commits = events.filter(e => e.kind === 'push');
  const notes = events.filter(e => (e.kind === 'comment' || e.kind === 'review') && e.body);
  const built = commits.reduce((sum, e) => sum + Math.max(1, e.count ?? 1), 0);
  const size: Room['size'] = built < 3 ? 'S' : built < 10 ? 'M' : 'L';

  const text = [cells.find(c => c.id === cellId)?.sub ?? '', ...commits.map(c => c.detail ?? '')].join(' ');
  const theme = THEMES.find(([re]) => re.test(text))?.[1] ?? 'The Workshop';

  return { commits, notes, size, theme };
}
