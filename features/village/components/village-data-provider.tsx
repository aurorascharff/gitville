import { notFound } from 'next/navigation';
import { preload, SWRConfig } from 'swr';
import { getRepoData } from '@/features/repo/repo-queries';
import { VillageUiProvider } from '@/features/village/providers/village-ui-provider';
import { getVillagePayload } from '@/features/village/village-queries';
import { villageKey } from '@/types/github';
import type { ReactNode } from 'react';

export async function VillageDataProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const repo = await getRepoData(slug);
  if (!repo) notFound();

  const cacheData = preload(villageKey(repo.slug), () => getVillagePayload(repo.slug, repo.defaultBranch));

  return (
    <SWRConfig value={{ cacheData }}>
      <VillageUiProvider slug={repo.slug}>{children}</VillageUiProvider>
    </SWRConfig>
  );
}
