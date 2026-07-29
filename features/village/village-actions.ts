'use server';

import { revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getRepoData } from '@/features/repo/repo-queries';
import { getAiRoomSpecPayload } from '@/features/village/village-queries';
import { parseRepoSlug, villagePayloadTag } from '@/lib/github';
import type { RoomSpecPayload } from '@/types/github';

type GenerateRoomFurnitureResult = { ok: true; spec: RoomSpecPayload } | { ok: false; error: string };
type RefreshVillageResult = { ok: true } | { ok: false; error: string };

const inputSchema = z.object({
  slug: z.string().regex(/^[\w.-]+\/[\w.-]+$/).max(140),
  cellId: z.string().min(1).max(120),
});

const refreshInputSchema = z.object({
  slug: z.string().min(1).max(140),
});

const globalStore = globalThis as typeof globalThis & {
  __gitvilleAiBuckets?: Map<string, { count: number; resetAt: number }>;
};

export async function generateRoomFurniture(input: unknown): Promise<GenerateRoomFurnitureResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'That room could not be found.' };

  const requestHeaders = await headers();
  if (!isSameAppRequest(requestHeaders)) return { ok: false, error: 'Open the app to fix furniture.' };

  const quota = takeAiQuota(requestHeaders, parsed.data.slug);
  if (!quota.ok) return quota;

  const spec = await getAiRoomSpecPayload(parsed.data.slug, parsed.data.cellId);
  if (!spec) return { ok: false, error: 'That room could not be found.' };
  if (!spec.ai) {
    return {
      ok: false,
      error: spec.aiAvailable ? 'The carpenter could not finish this room yet.' : 'AI furniture is not configured.',
    };
  }
  return { ok: true, spec };
}

export async function refreshVillage(input: unknown): Promise<RefreshVillageResult> {
  const parsed = refreshInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'That village could not be refreshed.' };

  const repoSlug = parseRepoSlug(parsed.data.slug);
  if (!repoSlug) return { ok: false, error: 'That village could not be refreshed.' };

  const requestHeaders = await headers();
  if (!isSameAppRequest(requestHeaders)) return { ok: false, error: 'Open the app to refresh this village.' };

  const quota = takeRefreshQuota(requestHeaders, repoSlug.slug);
  if (!quota.ok) return quota;

  const repo = await getRepoData(repoSlug.slug);
  if (!repo) return { ok: false, error: 'That village could not be refreshed.' };

  revalidateTag(villagePayloadTag(repo.slug), { expire: 0 });
  return { ok: true };
}

function isSameAppRequest(requestHeaders: Headers): boolean {
  const site = requestHeaders.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'same-site' && site !== 'none') return false;

  const origin = requestHeaders.get('origin') ?? requestHeaders.get('referer');
  if (!origin) return false;
  const trusted = trustedAppHost();
  const host = trusted ?? requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function trustedAppHost(): string | null {
  const origin = process.env.APP_ORIGIN;
  if (!origin) return null;
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

function takeAiQuota(requestHeaders: Headers, slug: string): { ok: true } | { ok: false; error: string } {
  const key = requestKey(requestHeaders);
  const now = Date.now();
  const store = bucketStore(now);
  const allowed =
    takeSlot(store, `ip:${key}`, 12, 10 * 60 * 1000, now) &&
    takeSlot(store, `repo:${key}:${slug}`, 4, 60 * 1000, now);

  return allowed ? { ok: true } : { ok: false, error: 'The carpenter is busy. Try again in a minute.' };
}

function takeRefreshQuota(requestHeaders: Headers, slug: string): { ok: true } | { ok: false; error: string } {
  const key = requestKey(requestHeaders);
  const now = Date.now();
  const store = bucketStore(now);
  const allowed =
    takeSlot(store, `refresh-ip:${key}`, 30, 10 * 60 * 1000, now) &&
    takeSlot(store, `refresh-repo:${key}:${slug}`, 6, 60 * 1000, now);

  return allowed ? { ok: true } : { ok: false, error: 'This village was refreshed too often. Try again in a minute.' };
}

function bucketStore(now: number) {
  globalStore.__gitvilleAiBuckets ??= new Map();
  for (const [key, bucket] of globalStore.__gitvilleAiBuckets) {
    if (bucket.resetAt <= now) globalStore.__gitvilleAiBuckets.delete(key);
  }
  return globalStore.__gitvilleAiBuckets;
}

function takeSlot(
  store: Map<string, { count: number; resetAt: number }>,
  key: string,
  limit: number,
  windowMs: number,
  now: number,
): boolean {
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

function requestKey(requestHeaders: Headers): string {
  const forwarded = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || requestHeaders.get('x-real-ip') || 'local';
}
