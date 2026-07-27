import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { preload, SWRConfig } from 'swr';
import { Crossfade } from '@/components/ui/crossfade';
import ErrorBoundary from '@/components/ui/error-boundary';
import { getPinnedRepos } from '@/features/repo/repo-cookie';
import { VillageWorld, VillageWorldSkeleton } from '@/features/village/components/village-world';
import { getVillagePayload, getRepoData } from '@/lib/github';
import { villageKey } from '@/types/github';

export const prefetch = 'allow-runtime';

export async function generateMetadata({ params }: PageProps<'/[owner]/[name]'>) {
  const { owner, name } = await params;
  return { title: `${owner}/${name}` };
}

export default function RepoVillagePage({ params }: PageProps<'/[owner]/[name]'>) {
  return (
    <ErrorBoundary title="This village couldn’t load">
      <Suspense fallback={<VillageWorldSkeleton />}>
        <Crossfade>
          {params.then(({ owner, name }) => (
            <Village slug={`${owner}/${name}`} />
          ))}
        </Crossfade>
      </Suspense>
    </ErrorBoundary>
  );
}

async function Village({ slug }: { slug: string }) {
  const [repo, pinned] = await Promise.all([getRepoData(slug), getPinnedRepos()]);
  if (!repo) notFound();

  const cacheData = preload(villageKey(repo.slug), () => getVillagePayload(repo.slug, repo.defaultBranch));

  return (
    <SWRConfig value={{ cacheData }}>
      <VillageWorld repo={repo} pinned={pinned} />
    </SWRConfig>
  );
}
