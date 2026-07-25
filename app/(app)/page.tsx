import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import { ProjectsGrid, ProjectsGridSkeleton } from '@/features/project/components/projects-grid';

export const prefetch = 'allow-runtime';

export default function ProjectsPage({ searchParams }: PageProps<'/'>) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h1 className="text-lg font-semibold">Projects</h1>
      </div>
      <Suspense fallback={<ProjectsGridSkeleton />}>
        <Crossfade>
          {searchParams.then(sp => (
            <ProjectsGrid query={typeof sp.q === 'string' ? sp.q : undefined} />
          ))}
        </Crossfade>
      </Suspense>
    </div>
  );
}
