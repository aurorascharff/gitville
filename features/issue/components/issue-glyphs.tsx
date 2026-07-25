import { Circle, CircleCheckBig, CircleDashed, CircleDot, CircleDotDashed, CircleSlash, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IssuePriority, IssueStatus } from '@/types/issue';

const STATUS_ICON: Record<IssueStatus, { icon: LucideIcon; className: string }> = {
  backlog: { icon: CircleDashed, className: 'text-muted-foreground' },
  todo: { icon: Circle, className: 'text-muted-foreground' },
  in_progress: { icon: CircleDotDashed, className: 'text-warning' },
  in_review: { icon: CircleDot, className: 'text-brand' },
  done: { icon: CircleCheckBig, className: 'text-success' },
  canceled: { icon: CircleSlash, className: 'text-muted-foreground/70' },
};

export function StatusIcon({ status, size = 15 }: { status: IssueStatus; size?: number }) {
  const { icon: Icon, className } = STATUS_ICON[status];
  return <Icon size={size} strokeWidth={2} className={cn('shrink-0', className)} aria-hidden="true" />;
}

const FILLED: Record<IssuePriority, number> = { none: 0, low: 1, medium: 2, high: 3, urgent: 0 };

export function PriorityIcon({ priority, size = 15 }: { priority: IssuePriority; size?: number }) {
  if (priority === 'urgent') {
    return (
      <span
        aria-hidden="true"
        style={{ height: size, width: size }}
        className="inline-flex shrink-0 items-center justify-center rounded-[3px] bg-warning text-[10px] font-bold text-background"
      >
        !
      </span>
    );
  }
  const filled = FILLED[priority];
  const bars = [
    { x: 1, h: 5 },
    { x: 6, h: 8 },
    { x: 11, h: 11 },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className="shrink-0" aria-hidden="true">
      {bars.map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={13 - bar.h}
          width={3}
          height={bar.h}
          rx={1}
          className={i < filled ? 'fill-foreground' : 'fill-muted-foreground/35'}
        />
      ))}
    </svg>
  );
}
