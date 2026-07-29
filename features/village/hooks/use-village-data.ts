'use client';

import useSWR, { preload } from 'swr';
import { villageKey, type RoomSpecPayload, type VillagePayload } from '@/types/github';

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

function mergePeople<T>(next: T[], previous: T[]): T[] {
  return next.length > 0 ? next : previous;
}

function mergePayload(previous: VillagePayload, next: VillagePayload): VillagePayload {
  if (!previous.ok || !next.ok) return next;
  const previousPrs = new Map(previous.prs.map(pr => [pr.number, pr]));
  const prs = next.prs.length > 0 ? next.prs : previous.prs;
  return {
    ...previous,
    ...next,
    partial: next.partial,
    warnings: next.warnings,
    prs: prs.map(pr => {
      const existing = previousPrs.get(pr.number);
      if (!existing) return pr;
      return {
        ...existing,
        ...pr,
        mergeable: pr.mergeable ?? existing.mergeable,
        mergeStateStatus: pr.mergeStateStatus ?? existing.mergeStateStatus,
        checkState: pr.checkState ?? existing.checkState,
        reviewDecision: pr.reviewDecision ?? existing.reviewDecision,
        reviewers: mergePeople(pr.reviewers, existing.reviewers),
        assignees: mergePeople(pr.assignees, existing.assignees),
      };
    }),
    branches: next.branches.length > 0 ? next.branches : previous.branches,
    events: next.events.length > 0 ? next.events : previous.events,
    versions: next.versions.length > 0 ? next.versions : previous.versions,
  };
}

function recoverPayload(slug: string, payload: VillagePayload, current?: VillagePayload): VillagePayload {
  rememberPayload(slug, payload);
  const previous = current?.ok ? current : lastGoodPayloads.get(slug);
  if (!payload.ok && previous) {
    return {
      ...previous,
      partial: true,
      warnings: payload.warnings ?? previous.warnings,
      fetchedAt: payload.fetchedAt,
    };
  }
  const merged = previous ? mergePayload(previous, payload) : payload;
  if (merged.ok && !merged.partial) return merged;
  if (!previous) return payload;
  return {
    ...merged,
    partial: true,
    warnings: payload.warnings ?? previous.warnings,
    fetchedAt: payload.fetchedAt,
  };
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

export function cachedRoomSpec(slug: string, cellId: string): RoomSpecPayload | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(roomSpecStorageKey(slug, cellId));
    if (!raw) return undefined;
    const spec = JSON.parse(raw) as RoomSpecPayload;
    return spec?.ok && spec.ai && spec.cellId === cellId ? spec : undefined;
  } catch {
    return undefined;
  }
}

export function rememberRoomSpec(slug: string, cellId: string, spec: RoomSpecPayload): void {
  if (typeof window === 'undefined' || !spec.ok || !spec.ai || spec.cellId !== cellId) return;
  try {
    window.localStorage.setItem(roomSpecStorageKey(slug, cellId), JSON.stringify(spec));
  } catch {}
}

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
    fallbackData: ai ? cachedRoomSpec(slug, cellId) : undefined,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnMount: false,
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

function roomSpecStorageKey(slug: string, cellId: string) {
  return `gitville:room-spec:${slug}:${cellId}`;
}
