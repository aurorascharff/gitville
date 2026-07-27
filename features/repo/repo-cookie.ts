import 'server-only';

import { cookies } from 'next/headers';

export const REPOS_COOKIE = 'gitville-repos';

// Busy repos so the app is alive on first visit, before any personalization.
export const DEFAULT_REPOS = ['vercel/next.js', 'facebook/react', 'vercel/swr', 'vitejs/vite'];

export async function getPinnedRepos(): Promise<string[]> {
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
