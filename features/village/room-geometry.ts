import { BARREL, CHEST, FIREPLACE, TABLE_LONG, WELL, WORKBENCH } from '@/features/village/components/pixel-sprite';
import type { RoomSpecItem } from '@/features/village/use-village-data';
import type { Cell } from '@/features/village/village-model';
import { hashString } from '@/lib/utils';
import type { BranchCommit } from '@/types/github';

export const WALL_H = 150;

export type RoomRole = 'attic' | 'middle' | 'ground' | 'single';
export type Build = { commits: BranchCommit[]; name?: string; kind?: string; pieces?: string[][] };

export function roomRole(cell: Cell): RoomRole {
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

export function buildWidth(build: Build): number {
  if (build.pieces?.length) {
    const scale = pieceScale(build);
    return build.pieces.reduce((sum, piece) => sum + Math.max(...piece.map(r => r.length)) * scale, 0);
  }
  return build.commits.reduce((sum, c) => sum + 8 * sizeScale(c), 0);
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
