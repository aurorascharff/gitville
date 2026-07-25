import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getDeployment } from '@/features/deployment/deployment-queries';
import { StatusBadge } from '@/features/deployment/components/deployment-status';
import { RelativeTime } from '@/components/ui/relative-time';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDuration } from '@/lib/utils';

export async function DeploymentHeader({ projectId, deployId }: { projectId: string; deployId: string }) {
  const deployment = await getDeployment(deployId);

  return (
    <>
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={13} strokeWidth={1.75} />
        Back to project
      </Link>
      <header className="mt-3 rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h2 className="truncate font-mono text-base">{deployment.version}</h2>
          <StatusBadge status={deployment.status} />
          <span className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase">{deployment.engine}</span>
        </div>
        <p className="mt-1.5 text-xs break-words text-muted-foreground">
          <code className="font-mono">{deployment.commit.sha.slice(0, 7)}</code>
          {' · '}
          {deployment.commit.branch}
          {' · '}
          <RelativeTime date={deployment.createdAt} />
          {deployment.durationMs != null ? ` · built in ${formatDuration(deployment.durationMs)}` : ''}
        </p>
        {deployment.url ? (
          <a
            href={deployment.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-xs transition-colors hover:bg-accent hover:text-foreground"
          >
            <ExternalLink size={12} strokeWidth={1.8} />
            {deployment.url.replace(/^https?:\/\//, '')}
          </a>
        ) : null}
      </header>
    </>
  );
}

export function DeploymentHeaderSkeleton() {
  return (
    <>
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <ArrowLeft size={13} strokeWidth={1.75} />
        <Skeleton className="h-3 w-24" />
      </span>
      <header className="mt-3 rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
        <Skeleton className="mt-2 h-3.5 w-2/3" />
      </header>
    </>
  );
}
