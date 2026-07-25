import { Suspense } from 'react';
import { IssuesView, IssuesViewSkeleton } from '@/features/issue/components/issues-view';

export const prefetch = 'allow-runtime';

const VIEW_LABEL: Record<string, string> = {
  mine: 'My issues',
  active: 'Active',
  backlog: 'Backlog',
  all: 'All issues',
};

function resolveView(sp: Record<string, string | string[] | undefined>): string {
  const v = sp.view;
  return typeof v === 'string' && v.length > 0 ? v : 'active';
}

export default function HomePage({ searchParams }: PageProps<'/'>) {
  return (
    <Suspense
      fallback={
        <>
          <ViewHeader title="Active" />
          <IssuesViewSkeleton />
        </>
      }
    >
      {searchParams.then(sp => {
        const view = resolveView(sp);
        return (
          <>
            <ViewHeader title={VIEW_LABEL[view] ?? view} />
            <IssuesView view={view} />
          </>
        );
      })}
    </Suspense>
  );
}

function ViewHeader({ title }: { title: string }) {
  return (
    <header className="flex h-11 shrink-0 items-center border-b px-4 sm:px-6">
      <h1 className="text-[13px] font-semibold tracking-tight">{title}</h1>
    </header>
  );
}
