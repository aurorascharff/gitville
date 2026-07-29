import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { getRepoData as getGitHubRepoData } from '@/lib/github';

export async function getRepoData(slug: string) {
  'use cache';
  cacheLife('hours');
  cacheTag(`repo-${slug}`);
  return getGitHubRepoData(slug);
}
