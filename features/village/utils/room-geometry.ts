import { BARREL, CHEST, FIREPLACE, TABLE_LONG, WELL, WORKBENCH } from '@/features/village/components/shared/pixel-sprite';
import type { RoomSpecItem } from '@/features/village/hooks/use-village-data';
import type { Cell } from '@/features/village/utils/village-model';
import { hashString } from '@/lib/utils';
import type { BranchCommit } from '@/types/github';

export const WALL_H = 150;

export const SIDEBAR_W = 360;

type RoomRole = 'attic' | 'middle' | 'ground' | 'single';
export type Build = { commits: BranchCommit[]; name?: string; kind?: string; pieces?: string[][] };
export type RoomFrame = { x: number; y: number; scale: number };

function roomRole(cell: Cell): RoomRole {
  if (cell.kind !== 'pr') return 'single';
  if (!cell.hidden && (cell.floors ?? 1) > 1) return 'attic';
  if (cell.hidden) return cell.stackedOn ? 'middle' : 'ground';
  return 'single';
}

export function roomDims(cell: Cell): [number, number] {
  if (cell.kind === 'main') return [1240, 740];
  if (cell.kind === 'branch') return [880, 600];
  if (cell.kind === 'issue') return [920, 600];
  if (cell.kind === 'inbox') return [1020, 660];
  const role = roomRole(cell);
  if (role === 'attic') return [860, 560];
  if (role === 'ground') return [1000, 660];
  return [1000, 620];
}

export function roomFrame(viewportW: number, viewportH: number, roomW: number, roomH: number): RoomFrame {
  const sidebar = viewportW < 640 ? 0 : Math.min(SIDEBAR_W, viewportW * 0.4);
  const availW = viewportW - sidebar;
  const scale = 1;
  const sw = roomW * scale;
  const sh = roomH * scale;
  return {
    x: sw <= availW ? sidebar + (availW - sw) / 2 : sidebar,
    y: sh <= viewportH ? (viewportH - sh) / 2 : 0,
    scale,
  };
}

export function followRoomFrame(
  viewportW: number,
  viewportH: number,
  roomW: number,
  roomH: number,
  focusX: number,
  focusY: number,
): RoomFrame {
  const sidebar = viewportW < 640 ? 0 : Math.min(SIDEBAR_W, viewportW * 0.4);
  const availW = viewportW - sidebar;
  const scale = 1;
  const sw = roomW * scale;
  const sh = roomH * scale;
  return {
    x:
      sw <= availW
        ? sidebar + (availW - sw) / 2
        : Math.min(sidebar, Math.max(sidebar + availW - sw, sidebar + availW / 2 - focusX * scale)),
    y: sh <= viewportH ? (viewportH - sh) / 2 : Math.min(0, Math.max(viewportH - sh, viewportH / 2 - focusY * scale)),
    scale,
  };
}

export function wallClass(cell: Cell): string {
  if (cell.kind === 'issue') return 'room-wall-tent';
  if (cell.kind === 'branch') return 'room-wall-log';
  if (cell.kind === 'main') return 'room-wall-hall';
  if (cell.kind === 'inbox') return 'room-wall-hedge';
  const role = roomRole(cell);
  if (role === 'attic') return 'room-wall-log';
  if (role === 'ground') return 'room-wall-stone';
  return `room-wall-${['cream', 'sage', 'sky'][hashString(cell.id) % 3]}`;
}

export function floorClass(cell: Cell): string {
  if (cell.kind === 'issue' || cell.kind === 'inbox') return 'room-floor-ground';
  if (cell.kind === 'branch') return 'room-floor-wood';
  if (cell.kind === 'main') return 'room-floor-stone';
  const role = roomRole(cell);
  if (role === 'attic') return 'room-floor-wood';
  if (role === 'ground') return 'room-floor-carpet';
  return `room-floor-${['wood', 'carpet'][hashString(cell.id) % 2]}`;
}

export function backdropFor(cell: Cell): string {
  const floor = floorClass(cell);
  if (floor.includes('ground')) return '#20301f';
  if (floor.includes('carpet')) return '#33201d';
  if (floor.includes('stone')) return '#26282b';
  return '#33261a';
}

export function centerpiece(cell: Cell): { art: string[]; palette: Record<string, string>; scale: number } | null {
  if (cell.kind === 'inbox') return { ...WELL, scale: 6 };
  if (cell.kind === 'main') return { ...TABLE_LONG, scale: 7 };
  if (cell.kind === 'branch') return { ...BARREL, scale: 7 };
  const role = roomRole(cell);
  if (role === 'attic') return { ...CHEST, scale: 7 };
  if (role === 'ground') return { ...FIREPLACE, scale: 7 };
  return { ...WORKBENCH, scale: 6 };
}

export function pieceScale(build: Build): number {
  const n = build.pieces?.length ?? build.commits.length;
  return n <= 2 ? 6 : n <= 4 ? 5 : 4;
}

export function sizeScale(commit: BranchCommit): number {
  if (commit.size >= 600) return 7;
  if (commit.size >= 200) return 6;
  if (commit.size >= 50) return 5;
  if (commit.size > 0) return 4;
  return 5;
}

function buildWidth(build: Build): number {
  if (build.pieces?.length) {
    const scale = pieceScale(build);
    return build.pieces.reduce((sum, piece) => sum + Math.max(...piece.map(r => r.length)) * scale, 0);
  }
  return build.commits.reduce((sum, c) => sum + 8 * sizeScale(c), 0);
}

export function heroIndex(builds: Build[]): number {
  let best = 0;
  let bestW = -1;
  builds.forEach((b, i) => {
    const bw = buildWidth(b);
    if (bw > bestW) {
      bestW = bw;
      best = i;
    }
  });
  return best;
}

export function composeScene(builds: Build[], w: number, floorH: number, hero: number): { x: number; y: number }[] {
  const pad = 70;
  const gap = 46;
  const pos: { x: number; y: number }[] = new Array(builds.length);
  const heroW = Math.min(buildWidth(builds[hero]), w - pad * 2);
  pos[hero] = { x: w / 2, y: floorH * 0.6 };
  const half = heroW / 2 + 70;

  const shelves = [
    { y: floorH * 0.3, x: pad, xMax: w - pad },
    { y: floorH * 0.77, x: pad, xMax: w / 2 - half },
    { y: floorH * 0.77, x: w / 2 + half, xMax: w - pad },
    { y: floorH * 0.47, x: pad, xMax: w / 2 - half - 30 },
    { y: floorH * 0.47, x: w / 2 + half + 30, xMax: w - pad },
  ];
  let si = 0;
  let cx = shelves[0].x;
  for (let i = 0; i < builds.length; i++) {
    if (i === hero) continue;
    const bw = Math.min(buildWidth(builds[i]), w - pad * 2);
    while (si < shelves.length && cx + bw > shelves[si].xMax) {
      si += 1;
      cx = shelves[si]?.x ?? pad;
    }
    if (si >= shelves.length) {
      si = 0;
      cx = shelves[0].x;
      shelves[0].y = Math.min(floorH - 90, shelves[0].y + 120);
    }
    pos[i] = { x: Math.min(cx + bw / 2, w - pad), y: shelves[si].y };
    cx += bw + gap;
  }
  return pos;
}

export function layoutBuilds(builds: Build[], w: number, floorH: number): { x: number; y: number }[] {
  const pad = 72;
  const gap = 40;
  const rowH = 128;
  const cx = w / 2;
  const cy = floorH / 2 - 20;
  const positions: { x: number; y: number }[] = [];
  let x = pad;
  let y = 100;

  for (const build of builds) {
    const bw = Math.min(buildWidth(build), w - pad * 2);
    if (x + bw > w - pad) {
      x = pad;
      y += rowH;
    }
    if (Math.abs(y - cy) < 120 && x < cx + 190 && x + bw > cx - 190) {
      x = cx + 190;
      if (x + bw > w - pad) {
        x = pad;
        y += rowH;
      }
    }
    if (y > floorH - 90) y = 130;
    positions.push({ x: x + bw / 2, y });
    x += bw + gap;
  }
  return positions;
}

export function toBuilds(commits: BranchCommit[], items: RoomSpecItem[] | undefined): Build[] {
  if (!items?.length) return commits.map(c => ({ commits: [c] }));
  const covered = new Set<number>();
  const builds: Build[] = [];
  for (const item of items) {
    const own = item.commits.filter(i => i >= 0 && i < commits.length && !covered.has(i)).map(i => commits[i]);
    item.commits.forEach(i => covered.add(i));
    if (own.length > 0) builds.push({ commits: own, name: item.name, kind: item.kind, pieces: item.pieces });
  }
  commits.forEach((c, i) => {
    if (!covered.has(i)) builds.push({ commits: [c] });
  });
  return builds;
}
