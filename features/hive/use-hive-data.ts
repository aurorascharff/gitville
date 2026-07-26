'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import {
  actorsAt,
  arcOffset,
  buildCells,
  commitWeights,
  type Actor,
  type Cell,
} from '@/features/hive/hive-world-model';
import { hiveKey, type HivePayload } from '@/types/github';

const fetcher = async (url: string): Promise<HivePayload> => {
  const payload = (await fetch(url).then(r => r.json())) as HivePayload;
  // Rate-limited upstream: throw so SWR keeps the previous snapshot on screen.
  if (!payload.ok) throw new Error('github-unavailable');
  return payload;
};

// Every component fetches its own data with this hook. SWR dedupes the key to one
// request, the server seeds it via preload + cacheData, and one poll revalidates all.
export function useHiveData(slug: string): { payload: HivePayload; stale: boolean } {
  const { data, error } = useSWR<HivePayload>(hiveKey(slug), fetcher, {
    suspense: true,
    refreshInterval: 15_000,
    revalidateOnFocus: true,
  });
  return { payload: data!, stale: Boolean(error) };
}

export const SCRUB_MAX = 1000;

export type TimeWindow = { minT: number; maxT: number; asOf: number; live: boolean };

export function useTimeWindow(payload: HivePayload, scrub: number): TimeWindow {
  return useMemo(() => {
    if (payload.events.length === 0) return { minT: 0, maxT: 0, asOf: 0, live: true };
    const times = payload.events.map(e => new Date(e.at).getTime());
    const minT = Math.min(...times);
    const maxT = Math.max(new Date(payload.fetchedAt).getTime(), Math.max(...times));
    const live = scrub === SCRUB_MAX;
    return { minT, maxT, live, asOf: live ? maxT : minT + (scrub / SCRUB_MAX) * (maxT - minT) };
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

export function useWorldModel(payload: HivePayload, slug: string, asOf: number): WorldModel {
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
