import 'server-only';

import { cache } from 'react';
import { getRepoData as getGitHubRepoData } from '@/lib/github';

export const getRepoData = cache(async (slug: string) => getGitHubRepoData(slug));
