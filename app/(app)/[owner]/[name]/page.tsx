import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import { VillageErrorSplash } from '@/components/ui/error-boundary';
import { getPinnedRepos } from '@/features/repo/repo-cookie';
import { getRepoData } from '@/features/repo/repo-queries';
import { VillageWorld, VillageWorldSkeleton } from '@/features/village/components/village-world';

export const prefetch = 'allow-runtime';

export async function generateMetadata({ params }: PageProps<'/[owner]/[name]'>) {
  const { owner, name } = await params;
  return { title: `${owner}/${name}` };
}

export default function RepoVillagePage({ params }: PageProps<'/[owner]/[name]'>) {
  return (
    <VillageErrorSplash title="This village couldn’t load">
      <Suspense fallback={<VillageWorldSkeleton />}>
        <Crossfade>
          {params.then(({ owner, name }) => (
            <Village slug={`${owner}/${name}`} />
          ))}
        </Crossfade>
      </Suspense>
    </VillageErrorSplash>
  );
}

async function Village({ slug }: { slug: string }) {
  const repoPromise = getRepoData(slug);
  const pinnedPromise = getPinnedRepos();
  const repo = await repoPromise;
  if (!repo) notFound();

  const pinned = await pinnedPromise;

  return <VillageWorld repo={repo} pinned={pinned} />;
}
