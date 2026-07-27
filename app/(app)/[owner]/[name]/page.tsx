import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import ErrorBoundary from '@/components/ui/error-boundary';
import { VillageView, VillageViewSkeleton } from '@/features/village/components/village-view';

export const prefetch = 'allow-runtime';

export async function generateMetadata({ params }: PageProps<'/[owner]/[name]'>) {
  const { owner, name } = await params;
  return { title: `${owner}/${name}` };
}

export default function RepoVillagePage({ params }: PageProps<'/[owner]/[name]'>) {
  return (
    <ErrorBoundary title="This village couldn’t load">
      <Suspense fallback={<VillageViewSkeleton />}>
        <Crossfade>
          {params.then(({ owner, name }) => (
            <VillageView slug={`${owner}/${name}`} />
          ))}
        </Crossfade>
      </Suspense>
    </ErrorBoundary>
  );
}
