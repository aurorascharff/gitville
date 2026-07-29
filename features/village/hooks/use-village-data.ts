'use client';

import useSWR, { preload } from 'swr';
import { villageKey, villageRefreshKey, type BranchCommit, type RoomNote, type VillagePayload } from '@/types/github';

const lastGoodPayloads = new Map<string, VillagePayload>();

function unavailablePayload(): VillagePayload {
  return {
    ok: false,
    fetchedAt: new Date().toISOString(),
    defaultBranch: '',
    prs: [],
    branches: [],
    events: [],
    versions: [],
  };
}

export const fetchVillagePayload = async (url: string): Promise<VillagePayload> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return unavailablePayload();
    return (await res.json()) as VillagePayload;
  } catch {
    return unavailablePayload();
  }
};

function rememberPayload(slug: string, payload: VillagePayload) {
  if (payload.ok && !payload.partial) lastGoodPayloads.set(slug, payload);
}

function recoverPayload(slug: string, payload: VillagePayload, current?: VillagePayload): VillagePayload {
  rememberPayload(slug, payload);
  if (payload.ok && !payload.partial) return payload;
  const previous = current?.ok && !current.partial ? current : lastGoodPayloads.get(slug);
  if (!previous) return payload;
  return {
    ...previous,
    partial: true,
    warnings: payload.warnings ?? previous.warnings,
    fetchedAt: payload.fetchedAt,
  };
}

export async function refreshVillagePayload(slug: string, current?: VillagePayload): Promise<VillagePayload> {
  const payload = await fetchVillagePayload(villageRefreshKey(slug));
  return recoverPayload(slug, payload, current);
}

export function useVillageData(slug: string): { payload: VillagePayload; stale: boolean; validating: boolean } {
  const { data, isValidating } = useSWR<VillagePayload>(villageKey(slug), fetchVillagePayload, {
    suspense: true,
    refreshInterval: 15_000,
    revalidateOnFocus: true,
    revalidateOnMount: false,
  });
  const rawPayload = data ?? unavailablePayload();
  const payload = recoverPayload(slug, rawPayload);
  if (payload !== rawPayload) return { payload, stale: true, validating: isValidating };
  return { payload, stale: Boolean(payload.partial), validating: isValidating };
}

export type RoomSpecItem = {
  name: string;
  kind?: string;
  pieces?: string[][];
  commits: number[];
};

export type RoomSpecPayload = {
  ok: boolean;
  cellId: string;
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
      cellId: '',
      theme: '',
      title: null,
      items: [],
      commits: [],
      notes: [],
      ai: false,
      aiAvailable: false,
    }));

export const roomSpecKey = (slug: string, cellId: string, ai: boolean) =>
  `/api/room?v=2&slug=${encodeURIComponent(slug)}&cell=${encodeURIComponent(cellId)}${ai ? '&ai=1' : ''}`;

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
  });
  const aiRes = useSWR<RoomSpecPayload>(ai ? roomSpecKey(slug, cellId, true) : null, specFetcher, {
    revalidateOnFocus: false,
  });
  const aiSpec = aiRes.data?.ok && aiRes.data.cellId === cellId ? aiRes.data : null;
  const baseSpec = base.data?.ok && base.data.cellId === cellId ? base.data : null;
  const spec = aiSpec ?? baseSpec;
  return {
    spec,
    loading: !spec && base.isLoading,
    aiPending: ai && !aiSpec && aiRes.isLoading,
  };
}
