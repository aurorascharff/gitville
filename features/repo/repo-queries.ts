import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { getRepoData as getGitHubRepoData, parseRepoSlug } from '@/lib/github';

export async function getRepoData(slug: string) {
  const parsed = parseRepoSlug(slug);
  if (!parsed) return null;
  return getRepoDataCached(parsed.slug);
}

async function getRepoDataCached(slug: string) {
  'use cache';
  cacheLife('hours');
  cacheTag(`repo-${slug}`);
  return getGitHubRepoData(slug);
}
