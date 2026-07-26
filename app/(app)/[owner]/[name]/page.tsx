import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import ErrorBoundary from '@/components/ui/error-boundary';
import { HiveView, HiveViewSkeleton } from '@/features/hive/components/hive-view';

export const prefetch = 'allow-runtime';

export async function generateMetadata({ params }: PageProps<'/[owner]/[name]'>) {
  const { owner, name } = await params;
  return { title: `${owner}/${name}` };
}

export default function RepoHivePage({ params }: PageProps<'/[owner]/[name]'>) {
  return (
    <ErrorBoundary title="The hive couldn’t sync this repo">
      <Suspense fallback={<HiveViewSkeleton />}>
        <Crossfade>
          {params.then(({ owner, name }) => (
            <HiveView slug={`${owner}/${name}`} />
          ))}
        </Crossfade>
      </Suspense>
    </ErrorBoundary>
  );
}
