'use client';

import useSWR, { preload } from 'swr';
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

export const roomSpecKey = (slug: string, cellId: string, ai: boolean) =>
  `/api/room?slug=${encodeURIComponent(slug)}&cell=${encodeURIComponent(cellId)}${ai ? '&ai=1' : ''}`;

export function preloadRoomSpec(slug: string, cellId: string): void {
  void preload(roomSpecKey(slug, cellId, false), specFetcher);
}

export function useRoomSpec(
  slug: string,
  cellId: string,
  ai = false,
): { spec: RoomSpecPayload | null; loading: boolean; aiPending: boolean } {
  const base = useSWR<RoomSpecPayload>(roomSpecKey(slug, cellId, false), specFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const aiRes = useSWR<RoomSpecPayload>(ai ? roomSpecKey(slug, cellId, true) : null, specFetcher, {
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
