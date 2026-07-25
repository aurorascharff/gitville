import Link from 'next/link';
import { Suspense } from 'react';
import { ProjectIcon } from '@/features/project/components/project-icon';
import { ProjectPin, ProjectPinSkeleton } from '@/features/project/components/project-pin';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusDot } from '@/components/ui/status-dot';
import type { Project } from '@/types/project';

export function ProjectCard({ project, pinnedIdsPromise }: { project: Project; pinnedIdsPromise: Promise<string[]> }) {
  return (
    <article className="group relative rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-accent/50">
      <header className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground"
        >
          <ProjectIcon name={project.icon} size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium">{project.name}</h3>
          <p className="truncate text-[11px] text-muted-foreground">{project.framework}</p>
        </div>
        <Suspense fallback={<ProjectPinSkeleton />}>
          <ProjectPin projectId={project.id} pinnedIdsPromise={pinnedIdsPromise} />
        </Suspense>
      </header>
      <footer className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <StatusDot status={project.status} />
        <span>{project.status}</span>
        <span className="ml-auto truncate font-mono text-[10px]">{project.productionUrl}</span>
      </footer>
      <Link
        href={`/projects/${project.id}`}
        prefetch
        aria-label={`Open ${project.name}`}
        className="absolute inset-0 rounded-lg focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      />
    </article>
  );
}

export function ProjectCardSkeleton() {
  return (
    <article className="rounded-lg border bg-card p-4">
      <header className="flex items-center gap-3">
        <Skeleton className="h-9 w-9" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
        <Skeleton className="h-7 w-14 rounded-md" />
      </header>
      <Skeleton className="mt-3 h-3 w-28" />
    </article>
  );
}
