import { Suspense } from 'react';
import { InsightsView, InsightsViewSkeleton } from '@/features/insight/components/insights-view';
import { Crossfade } from '@/components/ui/crossfade';

export const metadata = { title: 'Insights' };
export const prefetch = 'allow-runtime';

export default function InsightsPage() {
  return (
    <>
      <header className="flex h-11 shrink-0 items-center gap-2 border-b px-4 sm:px-6">
        <h1 className="text-[13px] font-semibold tracking-tight">Insights</h1>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> live
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <Suspense fallback={<InsightsViewSkeleton />}>
          <Crossfade>
            <InsightsView />
          </Crossfade>
        </Suspense>
      </div>
    </>
  );
}
