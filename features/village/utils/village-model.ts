import { hashString } from '@/lib/utils';
import type { RepoData, VersionChannel, VillagePayload, VillagePerson, WireEvent } from '@/types/github';

export const WORLD_W = 3500;
export const WORLD_H = 3000;
export const TOWN_EXIT = { x: 72, y: WORLD_H / 2 + 170 };
const CX = WORLD_W / 2;
const CY = WORLD_H / 2;

const DX = 350;
const DY = 295;
const MAX_PR_BUILDINGS = 24;
const MAX_ACTIVITY_FILLERS = 10;
const DAY_MS = 1000 * 60 * 60 * 24;

const RING_DIRS: [number, number][] = [
  [-1, 1],
  [-1, 0],
  [0, -1],
  [1, -1],
  [1, 0],
  [0, 1],
];

function hexSpiral(rings: number): [number, number][] {
  const out: [number, number][] = [[0, 0]];
  for (let r = 1; r <= rings; r++) {
    let q = r;
    let s = 0;
    for (const [dq, ds] of RING_DIRS) {
      for (let k = 0; k < r; k++) {
        out.push([q, s]);
        q += dq;
        s += ds;
      }
    }
  }
  return out;
}

const AXIAL = hexSpiral(4);

function slotPos(i: number): { x: number; y: number } {
  const [q, r] = AXIAL[i % AXIAL.length];
  return { x: CX + (q + r / 2) * DX, y: CY + r * DY };
}

type CellKind = 'main' | 'pr' | 'branch' | 'issue' | 'inbox';

type PrState = 'draft' | 'ready' | 'stacked';

export type Cell = {
  id: string;
  kind: CellKind;
  label: string;
  sub: string | null;
  url: string;
  draft?: boolean;
  conflict?: boolean;
  stale?: boolean;
  checkState?: VillagePayload['prs'][number]['checkState'];
  reviewDecision?: VillagePayload['prs'][number]['reviewDecision'];
  noteCount?: number;
  noteAuthor?: string | null;
  notePreview?: string | null;
  reviewers?: VillagePerson[];
  assignees?: VillagePerson[];
  versions?: VersionChannel[];
  prState?: PrState;
  floors?: number;
  stackedOn?: number;
  author?: string;
  ref?: string;
  baseRef?: string;
  hidden?: boolean;
  scale?: number;
  x: number;
  y: number;
};

type RepoSignal = Pick<RepoData, 'stars' | 'openIssues' | 'languages'>;

export function pickedPrs(payload: VillagePayload, repo?: RepoSignal): VillagePayload['prs'] {
  const byHead = new Map(payload.prs.filter(pr => pr.branch).map(pr => [pr.branch, pr]));
  const baseRefs = new Set(payload.prs.map(pr => pr.baseRef));
  const tops = payload.prs.filter(pr => !baseRefs.has(pr.branch));
  const activity = prActivity(payload.events);

  const groups = tops
    .map(top => {
      const stack = [top];
      let current = top;
      const seen = new Set([top.number]);
      for (;;) {
        const parent = byHead.get(current.baseRef);
        if (!parent || seen.has(parent.number)) break;
        seen.add(parent.number);
        stack.push(parent);
        current = parent;
      }

      const latest = Math.max(
        ...stack
          .flatMap(pr => [new Date(pr.updatedAt).getTime(), activity.get(pr.number)?.latest ?? 0])
          .filter(Number.isFinite),
      );
      const signal = stack.reduce((sum, pr) => {
        const events = activity.get(pr.number);
        return (
          sum +
          (events?.count ?? 0) * 5 +
          (pr.reviewers.length + pr.assignees.length) * 3 +
          (pr.checkState ? 2 : 0) +
          (pr.reviewDecision ? 2 : 0) +
          (pr.mergeable === 'CONFLICTING' || pr.mergeStateStatus === 'DIRTY' ? 4 : 0) +
          (isStalePr(pr.updatedAt) ? -10 : 0)
        );
      }, stack.length * 4);

      return {
        stack,
        score: latest / DAY_MS + signal,
      };
    })
    .sort((a, b) => b.score - a.score || b.stack.length - a.stack.length);

  return groups
    .slice(0, prGroupLimit(payload, repo))
    .sort((a, b) => b.stack[0].number - a.stack[0].number)
    .flatMap(group => group.stack);
}

function prGroupLimit(payload: VillagePayload, repo?: RepoSignal): number {
  if (payload.prs.length <= MAX_PR_BUILDINGS) return payload.prs.length;
  const size = projectSizeScore(payload, repo);
  if (size < 18) return Math.min(payload.prs.length, 36);
  if (size < 36) return Math.min(payload.prs.length, 30);
  return MAX_PR_BUILDINGS;
}

function prActivity(events: WireEvent[]): Map<number, { count: number; latest: number }> {
  const activity = new Map<number, { count: number; latest: number }>();
  for (const event of events) {
    if (!event.isPr || event.number == null) continue;
    const time = new Date(event.at).getTime();
    const current = activity.get(event.number) ?? { count: 0, latest: 0 };
    current.count += 1;
    if (Number.isFinite(time)) current.latest = Math.max(current.latest, time);
    activity.set(event.number, current);
  }
  return activity;
}

function prNoteSignal(events: WireEvent[], number: number): Pick<Cell, 'noteCount' | 'noteAuthor' | 'notePreview'> {
  const notes = events
    .filter(event => event.isPr && event.number === number && (event.kind === 'comment' || event.kind === 'review'))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const latest = notes[0];
  return {
    noteCount: notes.length,
    noteAuthor: latest?.actor ?? null,
    notePreview: latest?.body || latest?.line || null,
  };
}

function prNoteSummary(
  events: WireEvent[],
  pr: VillagePayload['prs'][number],
): Pick<Cell, 'noteCount' | 'noteAuthor' | 'notePreview'> {
  const signal = prNoteSignal(events, pr.number);
  return {
    ...signal,
    noteCount: Math.max(pr.noteCount ?? 0, signal.noteCount ?? 0),
  };
}

function isStalePr(updatedAt: string): boolean {
  const t = new Date(updatedAt).getTime();
  return Number.isFinite(t) && Date.now() - t > 1000 * 60 * 60 * 24 * 14;
}

function projectContributors(payload: VillagePayload): number {
  const people = new Set<string>();
  for (const event of payload.events) {
    if (!event.actor.endsWith('[bot]')) people.add(event.actor);
  }
  for (const pr of payload.prs) {
    if (!pr.author.endsWith('[bot]')) people.add(pr.author);
  }
  return people.size;
}

function projectSizeScore(payload: VillagePayload, repo?: RepoSignal): number {
  const stars = repo ? Math.log10(repo.stars + 1) * 9 : 0;
  const issues = repo ? Math.min(18, repo.openIssues / 60) : 0;
  const languages = repo ? repo.languages.length * 1.5 : 0;
  return stars + issues + languages + payload.prs.length * 0.55 + projectContributors(payload) * 0.7;
}

function mainBranchScale(payload: VillagePayload, repo?: RepoSignal): number {
  const score = projectSizeScore(payload, repo);
  if (score >= 48) return 7;
  if (score >= 28) return 6;
  return 5;
}

function openPullRequestSummary(payload: VillagePayload): string | null {
  if (payload.prs.length === 0 && !payload.prTotal) return null;
  if (payload.prTotal != null && payload.prTotal > payload.prs.length) {
    return `${payload.prs.length} of ${payload.prTotal} open PRs shown`;
  }
  if (payload.prTotal != null) return `${payload.prTotal} open PRs`;
  return payload.prs.length >= 64 ? `${payload.prs.length} open PRs shown` : `${payload.prs.length} open PRs`;
}

function mainBranchSub(payload: VillagePayload, repo?: RepoSignal): string {
  const contributors = projectContributors(payload);
  const parts = [
    repo && repo.stars > 0 ? `${repo.stars.toLocaleString()} stars` : null,
    contributors > 0 ? `${contributors} contributors` : null,
    openPullRequestSummary(payload),
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'default branch';
}

export const SCRUB_MAX = 1000;

type TimeWindow = { minT: number; maxT: number; asOf: number; live: boolean };

export function timeWindowFor(payload: VillagePayload, scrub: number): TimeWindow {
  if (payload.events.length === 0) return { minT: 0, maxT: 0, asOf: 0, live: true };
  const all = payload.events.map(e => new Date(e.at).getTime()).sort((a, b) => a - b);
  const maxT = Math.max(new Date(payload.fetchedAt).getTime(), all[all.length - 1]);
  const floor = all[Math.floor(all.length * 0.05)];
  const times = all.filter(t => t >= floor);
  const minT = times[0];
  const live = scrub === SCRUB_MAX;
  const idx = Math.min(times.length - 1, Math.floor((scrub / SCRUB_MAX) * (times.length - 1)));
  return { minT, maxT, live, asOf: live ? maxT : times[idx] };
}

function prStack(payload: VillagePayload, me: VillagePayload['prs'][number]): VillagePayload['prs'] {
  const linked = (pr: VillagePayload['prs'][number]) =>
    payload.prs.filter(
      other =>
        other.number !== pr.number &&
        ((pr.baseRef !== payload.defaultBranch && other.branch === pr.baseRef) ||
          (other.baseRef !== payload.defaultBranch && other.baseRef === pr.branch)),
    );
  const seen = new Set([me.number]);
  const component = [me];
  for (let i = 0; i < component.length; i++) {
    for (const next of linked(component[i])) {
      if (!seen.has(next.number)) {
        seen.add(next.number);
        component.push(next);
      }
    }
  }

  const depth = (pr: VillagePayload['prs'][number]) => {
    let value = 0;
    let current = pr;
    const guard = new Set([pr.number]);
    for (;;) {
      const parent = component.find(other => other.branch === current.baseRef);
      if (!parent || guard.has(parent.number)) break;
      guard.add(parent.number);
      current = parent;
      value++;
    }
    return value;
  };
  return component.slice().sort((a, b) => depth(b) - depth(a) || b.number - a.number);
}

export function prStackForCell(payload: VillagePayload, cell: Cell): { stack: VillagePayload['prs']; floorNo: number } {
  const me = cell.kind === 'pr' ? payload.prs.find(p => `pr:${p.number}` === cell.id) : undefined;
  if (!me) return { stack: [], floorNo: 1 };

  const stack = prStack(payload, me);
  const index = stack.findIndex(pr => `pr:${pr.number}` === cell.id);
  return { stack, floorNo: index >= 0 ? stack.length - index : 1 };
}

export function buildCells(
  payload: VillagePayload,
  slug: string,
  asOf = Number.POSITIVE_INFINITY,
  repo?: RepoSignal,
): Cell[] {
  const cells: Cell[] = [];
  let slot = 0;

  cells.push({
    id: 'main',
    kind: 'main',
    label: payload.defaultBranch,
    sub: mainBranchSub(payload, repo),
    url: `https://github.com/${slug}`,
    versions: payload.versions,
    scale: mainBranchScale(payload, repo),
    ...slotPos(slot++),
  });

  const squarePos = slotPos(slot++);

  const prNumbers = new Set(payload.prs.map(pr => pr.number));
  const byHead = new Map(payload.prs.filter(pr => pr.branch).map(pr => [pr.branch, pr]));
  const picked = pickedPrs(payload, repo);
  const baseRefs = new Set(picked.map(pr => pr.baseRef));
  const tops = picked.filter(pr => !baseRefs.has(pr.branch));
  const placed = new Set<number>();

  for (const pr of tops) {
    const floors = prStack(payload, pr).length;
    const under = byHead.get(pr.baseRef);
    const pos = slotPos(slot++);
    const notes = prNoteSummary(payload.events, pr);
    placed.add(pr.number);
    cells.push({
      id: `pr:${pr.number}`,
      kind: 'pr',
      label: `#${pr.number}`,
      sub: pr.title,
      url: pr.url,
      draft: pr.draft,
      conflict: pr.mergeable === 'CONFLICTING' || pr.mergeStateStatus === 'DIRTY',
      stale: isStalePr(pr.updatedAt),
      checkState: pr.checkState,
      reviewDecision: pr.reviewDecision,
      ...notes,
      reviewers: pr.reviewers,
      assignees: pr.assignees,
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
      const notes = prNoteSummary(payload.events, parent);
      placed.add(parent.number);
      cells.push({
        id: `pr:${parent.number}`,
        kind: 'pr',
        label: `#${parent.number}`,
        sub: parent.title,
        url: parent.url,
        draft: parent.draft,
        conflict: parent.mergeable === 'CONFLICTING' || parent.mergeStateStatus === 'DIRTY',
        stale: isStalePr(parent.updatedAt),
        checkState: parent.checkState,
        reviewDecision: parent.reviewDecision,
        ...notes,
        reviewers: parent.reviewers,
        assignees: parent.assignees,
        prState: 'stacked',
        floors: prStack(payload, parent).length,
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

  if (Number.isFinite(asOf)) {
    const past = new Map<number, WireEvent>();
    for (const e of payload.events) {
      if (e.kind !== 'pr_merged' && e.kind !== 'pr_closed') continue;
      if (e.number == null || prNumbers.has(e.number)) continue;
      if (new Date(e.at).getTime() <= asOf) continue;
      if (!past.has(e.number)) past.set(e.number, e);
    }
    for (const [number, e] of [...past].sort((a, b) => a[0] - b[0])) {
      if (slot >= AXIAL.length) break;
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
  const branches = payload.branches.filter(b => !prRefs.has(b.ref)).slice(0, 5);
  for (const b of branches.sort((x, y) => x.ref.localeCompare(y.ref))) {
    if (slot >= AXIAL.length) break;
    cells.push({
      id: `branch:${b.ref}`,
      kind: 'branch',
      label: b.ref.split('/').pop() ?? b.ref,
      sub: b.ref,
      url: `https://github.com/${slug}/tree/${encodeURIComponent(b.ref)}`,
      ...slotPos(slot++),
    });
  }

  const activity = new Map<number, { count: number; title: string | null; isPr: boolean }>();
  for (const e of payload.events) {
    if (e.number == null || prNumbers.has(e.number)) continue;
    const cur = activity.get(e.number) ?? { count: 0, title: null, isPr: false };
    cur.count += 1;
    if (!cur.title && e.detail) cur.title = e.detail;
    if (e.isPr) cur.isPr = true;
    activity.set(e.number, cur);
  }
  const shown = [...activity.entries()]
    .filter(([number]) => !cells.some(c => c.id === `pr:${number}` || c.id === `issue:${number}`))
    .filter(([, info]) => info.title || info.count > 1)
    .sort((a, b) => b[1].count - a[1].count || a[0] - b[0])
    .slice(0, Math.min(MAX_ACTIVITY_FILLERS, Math.max(0, AXIAL.length - slot)));
  for (const [number, info] of shown) {
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
    sub: 'unplaced repo activity',
    url: `https://github.com/${slug}/issues`,
    ...squarePos,
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

type PlacedActor = { actor: Actor; x: number; y: number };

type WorldModel = {
  cells: Cell[];
  actors: Actor[];
  placed: PlacedActor[];
  occupied: Map<string, number>;
};

export function worldModelFor(payload: VillagePayload, slug: string, asOf: number, repo?: RepoSignal): WorldModel {
  const cells = buildCells(payload, slug, asOf, repo);
  const actors = actorsAt(payload, cells, asOf);

  const byCell = new Map<string, Actor[]>();
  for (const actor of actors) byCell.set(actor.cellId, [...(byCell.get(actor.cellId) ?? []), actor]);
  const placed: PlacedActor[] = [];
  for (const [cellId, group] of byCell) {
    const cell = cells.find(candidate => candidate.id === cellId) ?? cells[0];
    group.forEach((actor, index) => {
      const offset = arcOffset(index, group.length);
      placed.push({ actor, x: cell.x + offset.x, y: cell.y + offset.y });
    });
  }

  const occupied = new Map<string, number>();
  for (const actor of actors) occupied.set(actor.cellId, (occupied.get(actor.cellId) ?? 0) + 1);

  return { cells, actors, placed, occupied };
}

export function hashDelay(login: string): number {
  return hashString(login) % 2000;
}

type Room = {
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
