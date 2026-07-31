import {
  BARREL,
  CHEST,
  FIREPLACE,
  furnitureByName,
  furnitureFor,
  sizedFurnitureArt,
  TABLE_LONG,
  WELL,
  WORKBENCH,
} from '@/features/village/components/shared/pixel-sprite';
import type { Cell } from '@/features/village/utils/village-model';
import { hashString } from '@/lib/utils';
import type { BranchCommit, RoomSpecItem } from '@/types/github';

export const WALL_H = 150;

export const SIDEBAR_W = 360;

type RoomRole = 'attic' | 'middle' | 'ground' | 'single';
export type Build = { commits: BranchCommit[]; name?: string; kind?: string; pieces?: string[][]; size?: number };
export type RoomFrame = { x: number; y: number; scale: number };
type ArtLetter = 'O' | 'W' | 'w' | 'm' | 's' | 'b' | 'r' | 'y' | 'g' | 'p' | 'c' | 'o' | 't';

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
  const scale = viewportW < 640 ? Math.max(0.62, Math.min(0.82, (availW - 28) / roomW, (viewportH - 130) / roomH)) : 1;
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
  const scale = viewportW < 640 ? Math.max(0.62, Math.min(0.82, (availW - 28) / roomW, (viewportH - 130) / roomH)) : 1;
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
  return Math.max(...build.commits.map(sizeScale), 5 + buildSize(build));
}

export function buildSize(build: Pick<Build, 'commits' | 'size'>): number {
  const size = build.size ?? build.commits.length;
  return Math.min(4, Math.max(1, Math.round(size)));
}

export function sizeScale(commit: BranchCommit): number {
  if (commit.size >= 600) return 8;
  if (commit.size >= 200) return 7;
  if (commit.size >= 50) return 6;
  if (commit.size > 0) return 5;
  return 6;
}

function buildWidth(build: Build): number {
  const scale = pieceScale(build);
  if (build.pieces?.length) {
    return Math.max(...build.pieces[0].map(r => r.length)) * scale;
  }
  const fallback = (build.kind ? furnitureByName(build.kind) : null) ?? furnitureFor(build.commits[0].sha);
  return Math.max(...sizedFurnitureArt(fallback, buildSize(build)).map(r => r.length)) * scale;
}

function generatedFurnitureArt(build: Pick<Build, 'commits' | 'name' | 'kind' | 'size'>): string[] {
  const seed = hashString(
    `${build.name ?? build.kind ?? 'furniture'}:${build.commits.map(commit => commit.sha).join(':')}`,
  );
  const level = buildSize(build);
  const w = Math.min(16, 9 + level * 2 + (seed % 2));
  const h = Math.min(12, 7 + level + ((seed >> 3) % 2));
  const grid = Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
  const accents: ArtLetter[] = ['b', 't', 'p', 'r', 'y', 'g', 'o', 's'];
  const accent = accents[seed % accents.length];
  const secondary = accents[(seed >> 4) % accents.length];

  const put = (x: number, y: number, ch: ArtLetter) => {
    if (x >= 0 && x < w && y >= 0 && y < h) grid[y][x] = ch;
  };
  const rect = (x: number, y: number, rw: number, rh: number, ch: ArtLetter) => {
    for (let yy = y; yy < y + rh; yy++) {
      for (let xx = x; xx < x + rw; xx++) put(xx, yy, ch);
    }
  };
  const box = (x: number, y: number, rw: number, rh: number, fill: ArtLetter) => {
    rect(x, y, rw, rh, 'O');
    if (rw > 2 && rh > 2) rect(x + 1, y + 1, rw - 2, rh - 2, fill);
  };

  switch (seed % 5) {
    case 0: {
      const bodyW = Math.min(w - 2, 8 + level * 2);
      const x = Math.floor((w - bodyW) / 2);
      box(x, 1, bodyW, Math.min(5 + level, h - 3), 'W');
      rect(x + 2, 2, Math.max(2, bodyW - 4), 2, accent);
      rect(x + 1, 5, bodyW - 2, 1, 'w');
      for (let i = 0; i < level; i++) put(x + 2 + i * 2, h - 4, secondary);
      put(x + 1, h - 2, 'W');
      put(x + bodyW - 2, h - 2, 'W');
      break;
    }
    case 1: {
      const bodyW = Math.min(w - 1, 9 + level);
      const x = Math.floor((w - bodyW) / 2);
      rect(x + 1, 1, bodyW - 2, 1, 'm');
      box(x, 2, bodyW, 4 + level, 'm');
      rect(x + 2, 3, Math.max(3, bodyW - 5), 2, accent);
      put(x + bodyW - 2, 4, secondary);
      put(x + bodyW - 2, 5, 'y');
      rect(x + 2, h - 3, bodyW - 4, 1, 'W');
      put(x + 2, h - 2, 'W');
      put(x + bodyW - 3, h - 2, 'W');
      break;
    }
    case 2: {
      const baseW = Math.min(w - 2, 8 + level * 2);
      const x = Math.floor((w - baseW) / 2);
      box(x, h - 5 - level, baseW, 4 + level, 'w');
      rect(x + 1, h - 4 - level, baseW - 2, 1, accent);
      rect(x + 2, h - 2 - level, Math.max(2, baseW - 4), 1, secondary);
      for (let y = 1; y < h - 5 - level; y++) {
        put(Math.floor(w / 2), y, 'm');
        if (y % 2 === 0) {
          put(Math.floor(w / 2) - 1 - (y % 3), y, accent);
          put(Math.floor(w / 2) + 1 + (y % 3), y, secondary);
        }
      }
      break;
    }
    case 3: {
      const bodyW = Math.min(w - 2, 10 + level);
      const x = Math.floor((w - bodyW) / 2);
      rect(x + 1, 1, bodyW - 2, 1, 'O');
      box(x, 2, bodyW, h - 4, 'W');
      for (let yy = 3; yy < h - 3; yy += 2) {
        rect(x + 1, yy, bodyW - 2, 1, yy % 4 === 1 ? accent : secondary);
        put(x + Math.min(bodyW - 2, 2 + (yy % Math.max(2, bodyW - 3))), yy, 'c');
      }
      break;
    }
    default: {
      const bodyW = Math.min(w - 2, 8 + level * 2);
      const x = Math.floor((w - bodyW) / 2);
      rect(x + 2, 1, bodyW - 4, 1, 'm');
      box(x, 2, bodyW, h - 5, 'W');
      rect(x + 2, 3, Math.max(2, bodyW - 4), Math.min(2 + level, h - 7), accent);
      put(x + 1, h - 5, secondary);
      put(x + bodyW - 2, h - 5, secondary);
      rect(x + 1, h - 3, bodyW - 2, 1, 'w');
      break;
    }
  }

  return grid.map(row => row.join(''));
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

export function toBuilds(commits: BranchCommit[], items: RoomSpecItem[] | undefined, ai = false): Build[] {
  if (!items?.length) return commits.map(c => ({ commits: [c] }));
  const covered = new Set<number>();
  const builds: Build[] = [];
  for (const item of items) {
    const own = item.commits.filter(i => i >= 0 && i < commits.length && !covered.has(i)).map(i => commits[i]);
    item.commits.forEach(i => covered.add(i));
    if (own.length > 0) {
      const build = { commits: own, name: item.name, kind: item.kind, pieces: item.pieces, size: item.size };
      builds.push({ ...build, pieces: build.pieces?.length ? build.pieces : ai ? [generatedFurnitureArt(build)] : undefined });
    }
  }
  commits.forEach((c, i) => {
    if (!covered.has(i)) builds.push({ commits: [c] });
  });
  return builds;
}
