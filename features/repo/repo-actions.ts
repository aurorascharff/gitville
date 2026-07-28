'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getRepoData } from '@/features/repo/repo-queries';
import { getPinnedRepos, REPOS_COOKIE } from '@/features/repo/utils/repo-cookie';
import { parseRepoSlug } from '@/lib/github';
import type { Route } from 'next';

const COOKIE_OPTS = { maxAge: 60 * 60 * 24 * 365, path: '/', sameSite: 'lax' as const };

export async function pinRepo(input: string) {
  const parsed = parseRepoSlug(input);
  if (!parsed) return { ok: false as const, error: 'Enter a repo like vercel/next.js' };

  const repo = await getRepoData(parsed.slug);
  if (!repo) return { ok: false as const, error: `Couldn't find ${parsed.slug} on GitHub` };

  const pinned = await getPinnedRepos();
  const next = [repo.slug, ...pinned.filter(s => s.toLowerCase() !== repo.slug.toLowerCase())].slice(0, 12);
  const store = await cookies();
  store.set(REPOS_COOKIE, JSON.stringify(next), COOKIE_OPTS);
  redirect(`/${repo.slug}` as Route);
}

export async function unpinRepo(slug: string) {
  const pinned = await getPinnedRepos();
  const next = pinned.filter(s => s.toLowerCase() !== slug.toLowerCase());
  const store = await cookies();
  store.set(REPOS_COOKIE, JSON.stringify(next), COOKIE_OPTS);
  return { ok: true as const };
}
