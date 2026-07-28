'use client';

import useSWR, { preload } from 'swr';
import { actorsAt, arcOffset, buildCells, type Actor, type Cell } from '@/features/village/village-model';
import { villageKey, type BranchCommit, type RoomNote, type VillagePayload } from '@/types/github';

const fetcher = async (url: string): Promise<VillagePayload> => {
  const payload = (await fetch(url).then(r => r.json())) as VillagePayload;
  if (!payload.ok) throw new Error('github-unavailable');
  return payload;
};

export function useVillageData(slug: string): { payload: VillagePayload; stale: boolean } {
  const { data, error } = useSWR<VillagePayload>(villageKey(slug), fetcher, {
    suspense: true,
    refreshInterval: 15_000,
    revalidateOnFocus: true,
    revalidateOnMount: false,
  });
  return { payload: data!, stale: Boolean(error) };
}

export type RoomSpecItem = {
  name: string;
  kind?: string;
  pieces?: string[][];
  commits: number[];
};

export type RoomSpecPayload = {
  ok: boolean;
  theme: string;
  title: string | null;
  items: RoomSpecItem[];
  commits: BranchCommit[];
  notes: RoomNote[];
  ai: boolean;
  aiAvailable: boolean;
};

const specFetcher = (url: string): Promise<RoomSpecPayload> =>
  fetch(url)
    .then(r => r.json() as Promise<RoomSpecPayload>)
    .catch(() => ({
      ok: false,
      theme: '',
      title: null,
      items: [],
      commits: [],
      notes: [],
      ai: false,
      aiAvailable: false,
    }));

const roomKey = (slug: string, cellId: string, ai: boolean) =>
  `/api/room?slug=${encodeURIComponent(slug)}&cell=${encodeURIComponent(cellId)}${ai ? '&ai=1' : ''}`;

export function preloadRoomSpec(slug: string, cellId: string): void {
  void preload(roomKey(slug, cellId, false), specFetcher);
}

export function useRoomSpec(
  slug: string,
  cellId: string,
  ai = false,
): { spec: RoomSpecPayload | null; loading: boolean; aiPending: boolean } {
  const base = useSWR<RoomSpecPayload>(roomKey(slug, cellId, false), specFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const aiRes = useSWR<RoomSpecPayload>(ai ? roomKey(slug, cellId, true) : null, specFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const aiSpec = aiRes.data?.ok ? aiRes.data : null;
  const baseSpec = base.data?.ok ? base.data : null;
  const spec = aiSpec ?? baseSpec;
  return {
    spec,
    loading: !spec && base.isLoading,
    aiPending: ai && !aiSpec && aiRes.isLoading,
  };
}

export const SCRUB_MAX = 1000;

type TimeWindow = { minT: number; maxT: number; asOf: number; live: boolean };

export function useTimeWindow(payload: VillagePayload, scrub: number): TimeWindow {
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

type PlacedActor = { actor: Actor; x: number; y: number };

type WorldModel = {
  cells: Cell[];
  actors: Actor[];
  placed: PlacedActor[];
  occupied: Map<string, number>;
};

export function useWorldModel(payload: VillagePayload, slug: string, asOf: number): WorldModel {
  const cells = buildCells(payload, slug, asOf);
  const actors = actorsAt(payload, cells, asOf);

  const byCell = new Map<string, Actor[]>();
  for (const a of actors) byCell.set(a.cellId, [...(byCell.get(a.cellId) ?? []), a]);
  const placed: PlacedActor[] = [];
  for (const [cellId, group] of byCell) {
    const cell = cells.find(c => c.id === cellId) ?? cells[0];
    group.forEach((actor, i) => {
      const off = arcOffset(i, group.length);
      placed.push({ actor, x: cell.x + off.x, y: cell.y + off.y });
    });
  }

  const occupied = new Map<string, number>();
  for (const a of actors) occupied.set(a.cellId, (occupied.get(a.cellId) ?? 0) + 1);

  return { cells, actors, placed, occupied };
}
