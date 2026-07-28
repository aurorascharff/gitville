import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { cookies } from 'next/headers';

export const REPOS_COOKIE = 'gitville-repos';
export const PINNED_REPOS_TAG = 'pinned-repos';

const DEFAULT_REPOS = ['vercel/next.js', 'facebook/react', 'vercel/swr', 'vitejs/vite'];

export async function getPinnedRepos(): Promise<string[]> {
  'use cache: private';
  cacheLife('days');
  cacheTag(PINNED_REPOS_TAG);

  const store = await cookies();
  const raw = store.get(REPOS_COOKIE)?.value;
  if (!raw) return DEFAULT_REPOS;
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed.slice(0, 12) : DEFAULT_REPOS;
  } catch {
    return DEFAULT_REPOS;
  }
}
