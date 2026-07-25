import Link from 'next/link';
import { getDeployments } from '@/features/deployment/deployment-queries';
import { StatusBadge } from '@/features/deployment/components/deployment-status';
import { RelativeTime } from '@/components/ui/relative-time';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Deployment } from '@/types/deployment';

export async function DeploymentsList({ projectId }: { projectId: string }) {
  const deployments = await getDeployments(projectId);

  return (
    <Panel>
      <ul className="divide-y">
        {deployments.map(d => (
          <DeploymentRow key={d.id} deployment={d} />
        ))}
      </ul>
    </Panel>
  );
}

function DeploymentRow({ deployment }: { deployment: Deployment }) {
  return (
    <li>
      <Link
        href={`/projects/${deployment.projectId}/deployments/${deployment.id}`}
        prefetch
        aria-label={`Open deployment ${deployment.version}`}
        className={cn(
          'grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 py-3 transition-colors sm:grid-cols-[110px_minmax(0,1fr)_auto]',
          'hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none',
        )}
      >
        <StatusBadge status={deployment.status} />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{deployment.version}</p>
          <code className="block truncate font-mono text-[10px] text-muted-foreground">
            {deployment.commit.sha.slice(0, 7)} · {deployment.commit.message || deployment.commit.branch}
          </code>
        </div>
        <span className="hidden text-right text-[11px] text-muted-foreground sm:block">
          <RelativeTime date={deployment.createdAt} />
        </span>
      </Link>
    </li>
  );
}

export function DeploymentsListSkeleton() {
  return (
    <Panel>
      <ul className="divide-y">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 py-3 sm:grid-cols-[110px_minmax(0,1fr)_auto]">
            <Skeleton className="h-5 w-16 rounded-md" />
            <div className="min-w-0 space-y-1.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-2.5 w-40" />
            </div>
            <Skeleton className="hidden h-2.5 w-10 sm:block" />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <header className="border-b px-4 py-2.5">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Deployments</h3>
      </header>
      {children}
    </section>
  );
}
