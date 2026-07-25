import { Suspense } from 'react';
import { PinnedProjects, PinnedProjectsSkeleton } from '@/features/project/components/pinned-projects';
import { RecentDeploys, RecentDeploysSkeleton } from '@/features/deployment/components/recent-deploys';

export function AppSidebar() {
  return (
    <aside className="hidden overflow-y-auto border-r bg-background px-3 py-6 sm:block md:px-4">
      <div className="space-y-6">
        <Suspense fallback={<PinnedProjectsSkeleton />}>
          <PinnedProjects />
        </Suspense>
        <Suspense fallback={<RecentDeploysSkeleton />}>
          <RecentDeploys />
        </Suspense>
      </div>
    </aside>
  );
}
