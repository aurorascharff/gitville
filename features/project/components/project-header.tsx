import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';
import { getPinnedProjectIds, getProject } from '@/features/project/project-queries';
import { ProjectIcon } from '@/features/project/components/project-icon';
import { ProjectPin, ProjectPinSkeleton } from '@/features/project/components/project-pin';
import { DeployButton } from '@/features/deployment/components/deploy-button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusDot } from '@/components/ui/status-dot';

export async function ProjectHeader({ id }: { id: string }) {
  const project = await getProject(id);
  const pinnedIdsPromise = getPinnedProjectIds();

  return (
    <>
      <BackLink href="/" label="Back to projects" />
      <header className="mt-3 flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-start sm:p-5">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <ProjectIcon name={project.icon} size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-lg font-semibold">{project.name}</h2>
              <a
                href={`https://${project.productionUrl}`}
                target="_blank"
                rel="noreferrer"
                className="truncate font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                {project.productionUrl}
              </a>
            </div>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <StatusDot status={project.status} />
              {project.status}
              <span className="ml-1 font-mono">· {project.repo}</span>
            </p>
          </div>
        </div>
        <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
          <Suspense fallback={<ProjectPinSkeleton />}>
            <ProjectPin projectId={project.id} pinnedIdsPromise={pinnedIdsPromise} />
          </Suspense>
          <DeployButton projectId={project.id} />
        </div>
      </header>
    </>
  );
}

export function ProjectHeaderSkeleton() {
  return (
    <>
      <BackLink href="/" label="Back to projects" />
      <header className="mt-3 flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-start sm:p-5">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3.5 w-40" />
          </div>
        </div>
        <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
          <Skeleton className="h-7 w-14 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      </header>
    </>
  );
}

function BackLink({ href, label }: { href: '/'; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
      <ArrowLeft size={13} strokeWidth={1.75} />
      {label}
    </Link>
  );
}
