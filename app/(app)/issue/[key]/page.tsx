import { Suspense } from 'react';
import { getIssueByKey } from '@/features/issue/issue-queries';
import { getCurrentUser, getTeammates } from '@/features/user/user-queries';
import { IssueDetail } from '@/features/issue/components/issue-detail';
import { Skeleton } from '@/components/ui/skeleton';

export const prefetch = 'allow-runtime';

export default function IssuePage({ params }: PageProps<'/issue/[key]'>) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      {params.then(async ({ key }) => {
        const [issue, teammates, user] = await Promise.all([getIssueByKey(key), getTeammates(), getCurrentUser()]);
        const currentUser = user ?? { id: '', name: 'You', avatarColor: 'violet' };
        return (
          <IssueDetail
            initial={issue}
            teammates={teammates}
            currentUser={{ id: currentUser.id, name: currentUser.name, avatarColor: currentUser.avatarColor }}
          />
        );
      })}
    </Suspense>
  );
}

function DetailSkeleton() {
  return (
    <>
      <div className="flex h-11 items-center gap-3 border-b px-4 sm:px-6">
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    </>
  );
}
