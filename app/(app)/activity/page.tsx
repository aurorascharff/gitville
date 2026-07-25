import { Suspense } from 'react';
import { ActivityFeed, ActivityFeedSkeleton } from '@/features/activity/components/activity-feed';
import { MarkReadOnView } from '@/features/activity/components/mark-read-on-view';
import { Crossfade } from '@/components/ui/crossfade';

export const metadata = { title: 'Activity' };
export const prefetch = 'allow-runtime';

export default function ActivityPage() {
  return (
    <>
      <header className="flex h-11 shrink-0 items-center border-b px-4 sm:px-6">
        <h1 className="text-[13px] font-semibold tracking-tight">Activity</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-2xl">
          <MarkReadOnView />
          <Suspense fallback={<ActivityFeedSkeleton />}>
            <Crossfade>
              <ActivityFeed />
            </Crossfade>
          </Suspense>
        </div>
      </div>
    </>
  );
}
