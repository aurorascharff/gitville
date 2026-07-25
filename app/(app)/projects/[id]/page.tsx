import { Suspense } from 'react';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Crossfade } from '@/components/ui/crossfade';
import { ProjectHeader, ProjectHeaderSkeleton } from '@/features/project/components/project-header';
import { DeploymentsList, DeploymentsListSkeleton } from '@/features/deployment/components/deployments-list';

export const prefetch = 'allow-runtime';
// Keep the request alive long enough for the simulated build's after() task on Vercel.
export const maxDuration = 60;

export default function ProjectPage({ params }: PageProps<'/projects/[id]'>) {
  return (
    <div className="mx-auto max-w-3xl">
      <Suspense fallback={<ProjectHeaderSkeleton />}>
        <Crossfade>{params.then(({ id }) => <ProjectHeader id={id} />)}</Crossfade>
      </Suspense>
      <div className="mt-6">
        <ErrorBoundary title="Deployments failed to load">
          <Suspense fallback={<DeploymentsListSkeleton />}>
            <Crossfade>{params.then(({ id }) => <DeploymentsList projectId={id} />)}</Crossfade>
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
