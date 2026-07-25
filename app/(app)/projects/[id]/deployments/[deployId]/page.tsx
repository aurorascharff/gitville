import { Suspense } from 'react';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Crossfade } from '@/components/ui/crossfade';
import { BuildLogs, BuildLogsSkeleton } from '@/features/deployment/components/build-logs';
import { DeploymentHeader, DeploymentHeaderSkeleton } from '@/features/deployment/components/deployment-header';

export const prefetch = 'allow-runtime';

export default function DeploymentPage({ params }: PageProps<'/projects/[id]/deployments/[deployId]'>) {
  return (
    <div className="mx-auto max-w-3xl">
      <Suspense fallback={<DeploymentHeaderSkeleton />}>
        <Crossfade>{params.then(({ id, deployId }) => <DeploymentHeader projectId={id} deployId={deployId} />)}</Crossfade>
      </Suspense>
      <div className="mt-6">
        <ErrorBoundary title="Build logs failed to load">
          <Suspense fallback={<BuildLogsSkeleton />}>
            {params.then(({ deployId }) => <BuildLogs deployId={deployId} />)}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
