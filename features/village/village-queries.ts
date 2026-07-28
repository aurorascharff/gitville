import 'server-only';

import { cache } from 'react';
import { getVillagePayload as getGitHubVillagePayload } from '@/lib/github';

export const getVillagePayload = cache(async (slug: string, defaultBranch: string) =>
  getGitHubVillagePayload(slug, defaultBranch),
);
