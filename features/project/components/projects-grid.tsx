import { FolderOpen } from 'lucide-react';
import { getPinnedProjectIds, getProjects } from '@/features/project/project-queries';
import { ProjectCard, ProjectCardSkeleton } from '@/features/project/components/project-card';

export async function ProjectsGrid({ query }: { query?: string }) {
  const projects = await getProjects({ query });
  // Not awaited: each card unwraps the pinned-ids promise on the client via use().
  const pinnedIdsPromise = getPinnedProjectIds();

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-card/40 px-4 py-16 text-center">
        <FolderOpen className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm font-medium">No projects found</p>
        <p className="text-xs text-muted-foreground">{query ? `Nothing matches “${query}”.` : 'Deploy something to get started.'}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} pinnedIdsPromise={pinnedIdsPromise} />
      ))}
    </div>
  );
}

export function ProjectsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
