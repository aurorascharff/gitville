'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import useSWR from 'swr';
import { hiveKey, type HivePayload, type RepoData } from '@/types/github';
import { actorsAt, arcOffset, buildCells, commitWeights, type Actor, type Cell } from '@/features/hive/hive-world-model';

const fetcher = async (url: string): Promise<HivePayload> => {
  const payload = (await fetch(url).then(r => r.json())) as HivePayload;
  // Rate-limited / failed upstream: throw so SWR keeps showing the previous snapshot.
  if (!payload.ok) throw new Error('github-unavailable');
  return payload;
};

export const SCRUB_MAX = 1000;

export type Tooltip = { x: number; y: number; title: string; body: string | null; when: string | null };
export type PlacedActor = { actor: Actor; x: number; y: number };

type HiveState = {
  repo: RepoData;
  pinned: string[];
  payload: HivePayload;
  stale: boolean;
  cells: Cell[];
  actors: Actor[];
  placed: PlacedActor[];
  occupied: Map<string, number>;
  weights: Map<string, number>;
  live: boolean;
  asOf: number;
  minT: number;
  scrub: number;
  setScrub: (v: number) => void;
  zoom: number;
  setZoom: (fn: (z: number) => number) => void;
  buzzOpen: boolean;
  setBuzzOpen: (fn: (o: boolean) => boolean) => void;
  focusId: string | null;
  setFocusId: (id: string | null) => void;
  tip: Tooltip | null;
  setTip: (t: Tooltip | null) => void;
};

const HiveContext = createContext<HiveState | null>(null);

export function useHive(): HiveState {
  const ctx = useContext(HiveContext);
  if (!ctx) throw new Error('useHive must be used inside <HiveProvider>');
  return ctx;
}

export function HiveProvider({ repo, pinned, children }: { repo: RepoData; pinned: string[]; children: React.ReactNode }) {
  const { data, error } = useSWR<HivePayload>(hiveKey(repo.slug), fetcher, {
    suspense: true,
    refreshInterval: 15_000,
    revalidateOnFocus: true,
  });

  const [scrub, setScrub] = useState(SCRUB_MAX);
  const [zoom, setZoomState] = useState(1);
  const [buzzOpen, setBuzzOpenState] = useState(true);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [tip, setTip] = useState<Tooltip | null>(null);

  const payload = data!;
  const cells = useMemo(() => buildCells(payload, repo.slug), [payload, repo.slug]);

  const [minT, maxT] = useMemo(() => {
    if (payload.events.length === 0) return [0, 0];
    const times = payload.events.map(e => new Date(e.at).getTime());
    return [Math.min(...times), Math.max(new Date(payload.fetchedAt).getTime(), Math.max(...times))];
  }, [payload]);

  const live = scrub === SCRUB_MAX;
  const asOf = live ? maxT : minT + (scrub / SCRUB_MAX) * (maxT - minT);
  const actors = useMemo(() => actorsAt(payload, cells, asOf), [payload, cells, asOf]);

  // Villagers stand in arcs at the foot of their cell.
  const placed = useMemo<PlacedActor[]>(() => {
    const byCell = new Map<string, Actor[]>();
    for (const a of actors) {
      const list = byCell.get(a.cellId) ?? [];
      list.push(a);
      byCell.set(a.cellId, list);
    }
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

  const weights = useMemo(() => commitWeights(payload, cells), [payload, cells]);

  const occupied = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of actors) counts.set(a.cellId, (counts.get(a.cellId) ?? 0) + 1);
    return counts;
  }, [actors]);

  const value: HiveState = {
    repo,
    pinned,
    payload,
    stale: Boolean(error),
    cells,
    actors,
    placed,
    occupied,
    weights,
    live,
    asOf,
    minT,
    scrub,
    setScrub,
    zoom,
    setZoom: fn => setZoomState(z => fn(z)),
    buzzOpen,
    setBuzzOpen: fn => setBuzzOpenState(o => fn(o)),
    focusId,
    setFocusId,
    tip,
    setTip,
  };

  return <HiveContext.Provider value={value}>{children}</HiveContext.Provider>;
}
