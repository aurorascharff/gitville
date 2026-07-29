import 'server-only';

import { getVillagePayload as getGitHubVillagePayload } from '@/lib/github';

export async function getVillagePayload(slug: string, defaultBranch: string) {
  return getGitHubVillagePayload(slug, defaultBranch);
}
