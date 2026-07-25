import { cn } from '@/lib/utils';
import type { DeploymentStatus } from '@/types/deployment';
import type { ProjectStatus } from '@/types/project';

const STATUS_TONE: Record<ProjectStatus | DeploymentStatus, string> = {
  production: 'bg-success',
  ready: 'bg-success',
  building: 'bg-warning animate-pulse',
  paused: 'bg-muted-foreground',
  failed: 'bg-destructive',
  queued: 'bg-muted-foreground',
  cancelled: 'bg-muted-foreground',
};

export function StatusDot({ status, className }: { status: ProjectStatus | DeploymentStatus; className?: string }) {
  return <span aria-hidden="true" className={cn('inline-block h-1.5 w-1.5 rounded-full', STATUS_TONE[status], className)} />;
}
