import Link from 'next/link';
import { Pin } from 'lucide-react';
import { getPinnedProjectIds, getProjects } from '@/features/project/project-queries';
import { ProjectIcon } from '@/features/project/components/project-icon';
import { Skeleton } from '@/components/ui/skeleton';

export async function PinnedProjects() {
  const [pinnedIds, projects] = await Promise.all([getPinnedProjectIds(), getProjects()]);
  const pinned = projects.filter(p => pinnedIds.includes(p.id));

  return (
    <section>
      <SectionTitle icon={<Pin size={11} strokeWidth={1.8} />}>Pinned</SectionTitle>
      {pinned.length === 0 ? (
        <p className="mt-2 flex h-8 items-center px-2 text-[11px] text-muted-foreground">Pin a project to see it here.</p>
      ) : (
        <ul className="mt-2 space-y-0.5">
          {pinned.map(p => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                prefetch
                className="flex h-8 items-center gap-2 rounded-md px-2 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ProjectIcon name={p.icon} size={14} className="shrink-0" />
                <span className="truncate text-foreground">{p.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PinnedProjectsSkeleton() {
  return (
    <section>
      <SectionTitle icon={<Pin size={11} strokeWidth={1.8} />}>Pinned</SectionTitle>
      <div className="mt-2 flex h-8 items-center gap-2 px-2">
        <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-sm" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </section>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 px-2 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
      {icon}
      {children}
    </h3>
  );
}
