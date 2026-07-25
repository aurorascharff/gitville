import { preload, SWRConfig } from 'swr';
import { getInsights } from '@/features/insight/insight-queries';
import { InsightsBoard } from '@/features/insight/components/insights-board';
import { Skeleton } from '@/components/ui/skeleton';
import { INSIGHTS_KEY } from '@/types/insight';

export async function InsightsView() {
  const cacheData = preload(INSIGHTS_KEY, () => getInsights());
  return (
    <SWRConfig value={{ cacheData }}>
      <InsightsBoard />
    </SWRConfig>
  );
}

export function InsightsViewSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[74px]" />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}
