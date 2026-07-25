import Link from 'next/link';
import { GitCommit } from 'lucide-react';
import { getRecentDeployments } from '@/features/deployment/deployment-queries';
import { getProjects } from '@/features/project/project-queries';
import { RelativeTime } from '@/components/ui/relative-time';
import { StatusDot } from '@/components/ui/status-dot';
import { Skeleton } from '@/components/ui/skeleton';

export async function RecentDeploys() {
  const [deploys, projects] = await Promise.all([getRecentDeployments(6), getProjects()]);
  const nameById = new Map(projects.map(p => [p.id, p.name]));

  return (
    <section>
      <SectionTitle icon={<GitCommit size={11} strokeWidth={1.8} />}>Recent deploys</SectionTitle>
      <ul className="mt-2 space-y-0.5">
        {deploys.map(d => (
          <li key={d.id}>
            <Link
              href={`/projects/${d.projectId}/deployments/${d.id}`}
              prefetch
              className="flex h-11 items-center gap-2 rounded-md px-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <StatusDot status={d.status} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] leading-tight font-medium text-foreground">{nameById.get(d.projectId) ?? d.projectId}</p>
                <span className="text-[10px] leading-none text-muted-foreground">
                  {d.version} · <RelativeTime date={d.createdAt} />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RecentDeploysSkeleton() {
  return (
    <section>
      <SectionTitle icon={<GitCommit size={11} strokeWidth={1.8} />}>Recent deploys</SectionTitle>
      <ul className="mt-2 space-y-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex h-11 items-center gap-2 px-2">
            <Skeleton className="h-1.5 w-1.5 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
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
