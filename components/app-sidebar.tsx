import Link from 'next/link';
import { Suspense } from 'react';
import { getProjects } from '@/features/project/project-queries';
import { NotificationBell } from '@/features/activity/components/notification-bell';
import { ViewerAvatar } from '@/features/user/components/viewer-avatar';
import { SideNav } from '@/components/side-nav';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LoopMark } from '@/components/loop-mark';
import { Skeleton } from '@/components/ui/skeleton';

export async function AppSidebar() {
  const projects = await getProjects();

  return (
    <aside className="hidden w-[232px] shrink-0 flex-col justify-between border-r bg-card/40 px-3 py-4 md:flex">
      <div className="flex flex-col gap-5">
        <Link href="/?view=active" className="flex items-center gap-2 px-2 text-sm font-semibold tracking-tight">
          <LoopMark size={22} />
          Loop
        </Link>
        <Suspense fallback={<NavSkeleton />}>
          <SideNav projects={projects} />
        </Suspense>
      </div>

      <div className="flex flex-col gap-3 border-t pt-3">
        <div className="flex items-center gap-1 px-1">
          <NotificationBell />
          <ThemeToggle />
        </div>
        <div className="px-1">
          <Suspense fallback={<div className="flex items-center gap-2"><Skeleton className="h-6 w-6 rounded-full" /><Skeleton className="h-3 w-24" /></div>}>
            <ViewerAvatar />
          </Suspense>
        </div>
      </div>
    </aside>
  );
}

function NavSkeleton() {
  return (
    <div className="space-y-1.5 px-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-28" />
      ))}
    </div>
  );
}
