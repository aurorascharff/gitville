import { revalidateTag } from 'next/cache';
import { getRepoData } from '@/features/repo/repo-queries';
import { getVillagePayload } from '@/features/village/village-queries';
import { parseRepoSlug, villagePayloadTag } from '@/lib/github';

export async function GET(_request: Request, { params }: RouteContext<'/api/village/[owner]/[name]'>) {
  const { owner, name } = await params;
  const slug = `${owner}/${name}`;
  const repo = await getRepoData(slug);
  if (!repo) {
    return Response.json({
      ok: false,
      fetchedAt: new Date().toISOString(),
      defaultBranch: 'main',
      prs: [],
      branches: [],
      events: [],
      versions: [],
    });
  }
  return Response.json(await getVillagePayload(repo.slug, repo.defaultBranch));
}

const globalStore = globalThis as typeof globalThis & {
  __gitvilleRefreshBuckets?: Map<string, { count: number; resetAt: number }>;
};

export async function POST(request: Request, { params }: RouteContext<'/api/village/[owner]/[name]'>) {
  const { owner, name } = await params;
  const parsed = parseRepoSlug(`${owner}/${name}`);
  if (!parsed) return Response.json({ ok: false, error: 'That village could not be refreshed.' }, { status: 400 });
  if (!isSameAppRequest(request.headers)) {
    return Response.json({ ok: false, error: 'Open the app to refresh this village.' }, { status: 403 });
  }
  const quota = takeRefreshQuota(request.headers, parsed.slug);
  if (!quota.ok) return Response.json(quota, { status: 429 });

  const repo = await getRepoData(parsed.slug);
  if (!repo) return Response.json({ ok: false, error: 'That village could not be refreshed.' }, { status: 404 });

  revalidateTag(villagePayloadTag(repo.slug), { expire: 0 });
  return Response.json({ ok: true });
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

function takeRefreshQuota(requestHeaders: Headers, slug: string): { ok: true } | { ok: false; error: string } {
  const key = requestKey(requestHeaders);
  const now = Date.now();
  const store = bucketStore(now);
  const allowed =
    takeSlot(store, `ip:${key}`, 30, 10 * 60 * 1000, now) &&
    takeSlot(store, `repo:${key}:${slug}`, 6, 60 * 1000, now);

  return allowed ? { ok: true } : { ok: false, error: 'This village was refreshed too often. Try again in a minute.' };
}

function bucketStore(now: number) {
  globalStore.__gitvilleRefreshBuckets ??= new Map();
  for (const [key, bucket] of globalStore.__gitvilleRefreshBuckets) {
    if (bucket.resetAt <= now) globalStore.__gitvilleRefreshBuckets.delete(key);
  }
  return globalStore.__gitvilleRefreshBuckets;
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
