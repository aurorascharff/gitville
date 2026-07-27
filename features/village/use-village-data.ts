'use client';

import { useMemo } from 'react';
import useSWR, { preload } from 'swr';
import {
  actorsAt,
  arcOffset,
  buildCells,
  commitWeights,
  type Actor,
  type Cell,
} from '@/features/village/village-model';
import { villageKey, type BranchCommit, type VillagePayload } from '@/types/github';

const fetcher = async (url: string): Promise<VillagePayload> => {
  const payload = (await fetch(url).then(r => r.json())) as VillagePayload;
  // Rate-limited upstream: throw so SWR keeps the previous snapshot on screen.
  if (!payload.ok) throw new Error('github-unavailable');
  return payload;
};

// Every component fetches its own data with this hook. SWR dedupes the key to one
// request, the server seeds it via preload + cacheData, and one poll revalidates all.
export function useVillageData(slug: string): { payload: VillagePayload; stale: boolean } {
  const { data, error } = useSWR<VillagePayload>(villageKey(slug), fetcher, {
    suspense: true,
    refreshInterval: 15_000,
    revalidateOnFocus: true,
  });
  return { payload: data!, stale: Boolean(error) };
}

export type RoomSpecItem = {
  name: string;
  kind?: string;
  art?: string[];
  commits: number[];
};

export type RoomSpecPayload = {
  ok: boolean;
  theme: string;
  wall: 'cream' | 'sage' | 'sky' | 'stone';
  floor: 'wood' | 'stone' | 'carpet';
  items: RoomSpecItem[];
  commits: BranchCommit[];
};

// A failed spec fetch degrades to the default room — never an error for decoration.
const specFetcher = (url: string): Promise<RoomSpecPayload> =>
  fetch(url)
    .then(r => r.json() as Promise<RoomSpecPayload>)
    .catch(() => ({ ok: false, theme: '', wall: 'cream' as const, floor: 'wood' as const, items: [], commits: [] }));

const roomKey = (slug: string, cellId: string) =>
  `/api/room?slug=${encodeURIComponent(slug)}&cell=${encodeURIComponent(cellId)}`;

// Warm the cache on intent so the room is usually ready before the door opens.
export function preloadRoomSpec(slug: string, cellId: string): void {
  void preload(roomKey(slug, cellId), specFetcher);
}

export function useRoomSpec(slug: string, cellId: string): { spec: RoomSpecPayload | null; loading: boolean } {
  const { data, isLoading } = useSWR<RoomSpecPayload>(roomKey(slug, cellId), specFetcher, {
    revalidateOnFocus: false,
  });
  return { spec: data?.ok ? data : null, loading: isLoading };
}

export const SCRUB_MAX = 1000;

export type TimeWindow = { minT: number; maxT: number; asOf: number; live: boolean };

// Scrubbing is indexed over events, not wall-clock, so every slider position lands on
// a moment where something actually happened.
export function useTimeWindow(payload: VillagePayload, scrub: number): TimeWindow {
  return useMemo(() => {
    if (payload.events.length === 0) return { minT: 0, maxT: 0, asOf: 0, live: true };
    const times = payload.events.map(e => new Date(e.at).getTime()).sort((a, b) => a - b);
    const minT = times[0];
    const maxT = Math.max(new Date(payload.fetchedAt).getTime(), times[times.length - 1]);
    const live = scrub === SCRUB_MAX;
    const idx = Math.min(times.length - 1, Math.floor((scrub / SCRUB_MAX) * (times.length - 1)));
    return { minT, maxT, live, asOf: live ? maxT : times[idx] };
  }, [payload, scrub]);
}

export type PlacedActor = { actor: Actor; x: number; y: number };

export type WorldModel = {
  cells: Cell[];
  actors: Actor[];
  placed: PlacedActor[];
  occupied: Map<string, number>;
  weights: Map<string, number>;
};

export function useWorldModel(payload: VillagePayload, slug: string, asOf: number): WorldModel {
  const cells = useMemo(() => buildCells(payload, slug), [payload, slug]);
  const actors = useMemo(() => actorsAt(payload, cells, asOf), [payload, cells, asOf]);
  const weights = useMemo(() => commitWeights(payload, cells), [payload, cells]);

  const placed = useMemo<PlacedActor[]>(() => {
    const byCell = new Map<string, Actor[]>();
    for (const a of actors) byCell.set(a.cellId, [...(byCell.get(a.cellId) ?? []), a]);
    const out: PlacedActor[] = [];
    for (const [cellId, group] of byCell) {
      const cell = cells.find(c => c.id === cellId) ?? cells[0];
      group.forEach((actor, i) => {
        const off = arcOffset(i, group.length);
        out.push({ actor, x: cell.x + off.x, y: cell.y + off.y });
      });
    }
    return out;
  }, [actors, cells]);

  const occupied = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of actors) counts.set(a.cellId, (counts.get(a.cellId) ?? 0) + 1);
    return counts;
  }, [actors]);

  return { cells, actors, placed, occupied, weights };
}
