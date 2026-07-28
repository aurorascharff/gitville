import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { cache } from 'react';
import { getRepoData as getGitHubRepoData } from '@/lib/github';

export const getRepoData = cache(async (slug: string) => {
  'use cache';
  cacheLife('hours');
  cacheTag(`repo-${slug}`);
  return getGitHubRepoData(slug);
});
