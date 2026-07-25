import { preload, SWRConfig } from 'swr';
import { getIssuesForView } from '@/features/issue/issue-queries';
import { getProjects } from '@/features/project/project-queries';
import { getCurrentUserId, getTeammates } from '@/features/user/user-queries';
import { IssueWorkspace } from '@/features/issue/components/issue-workspace';
import { Skeleton } from '@/components/ui/skeleton';
import { issuesKey } from '@/types/issue';

export async function IssuesView({ view }: { view: string }) {
  const userId = await getCurrentUserId();
  const [teammates, projects] = await Promise.all([getTeammates(), getProjects()]);

  // Seed the SWR cache on the server so the list hydrates with no refetch, then polls live.
  const key = issuesKey(view);
  const cacheData = preload(key, () => getIssuesForView(view, userId));

  return (
    <SWRConfig value={{ cacheData }}>
      <IssueWorkspace view={view} teammates={teammates} projects={projects} />
    </SWRConfig>
  );
}

export function IssuesViewSkeleton() {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="px-4 py-2 sm:px-6">
        <Skeleton className="h-4 w-28" />
      </div>
      {[0, 1].map(g => (
        <div key={g}>
          <div className="flex items-center gap-2 border-b px-4 py-1.5 sm:px-6">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5 sm:px-6">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 flex-1" style={{ maxWidth: `${40 + ((i * 17) % 40)}%` }} />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
