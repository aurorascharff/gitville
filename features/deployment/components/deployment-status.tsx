import { Badge } from '@/components/ui/badge';
import { StatusDot } from '@/components/ui/status-dot';
import type { DeploymentStatus } from '@/types/deployment';

export const STATUS_VARIANT: Record<DeploymentStatus, 'success' | 'warning' | 'destructive' | 'muted'> = {
  ready: 'success',
  building: 'warning',
  failed: 'destructive',
  queued: 'muted',
  cancelled: 'muted',
};

export function StatusBadge({ status }: { status: DeploymentStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      <StatusDot status={status} className="dot" />
      {status}
    </Badge>
  );
}
