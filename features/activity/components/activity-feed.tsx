import Link from 'next/link';
import { CircleDot, GitCommitVertical, MessageSquare, PlusCircle, SignalHigh, UserPlus } from 'lucide-react';
import { getRecentEvents } from '@/features/activity/activity-queries';
import { RelativeTime } from '@/components/ui/relative-time';
import { Skeleton } from '@/components/ui/skeleton';
import type { EventType } from '@/types/event';
import type { Route } from 'next';

const ICON: Record<EventType, { icon: typeof CircleDot; tone: string }> = {
  'issue.created': { icon: PlusCircle, tone: 'text-brand' },
  'issue.status': { icon: CircleDot, tone: 'text-warning' },
  'issue.assigned': { icon: UserPlus, tone: 'text-muted-foreground' },
  'issue.priority': { icon: SignalHigh, tone: 'text-muted-foreground' },
  'issue.commented': { icon: MessageSquare, tone: 'text-muted-foreground' },
  'issue.labeled': { icon: GitCommitVertical, tone: 'text-muted-foreground' },
};

export async function ActivityFeed() {
  const events = await getRecentEvents();

  if (events.length === 0) {
    return <p className="rounded-lg border border-dashed bg-card/40 px-4 py-16 text-center text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ul className="overflow-hidden rounded-lg border bg-card">
      {events.map(event => {
        const { icon: Icon, tone } = ICON[event.type];
        const row = (
          <div className="flex items-center gap-3 px-4 py-2.5">
            <Icon size={15} strokeWidth={1.9} className={`shrink-0 ${tone}`} />
            <p className="min-w-0 flex-1 truncate text-[13px]">
              <span className="font-medium">{event.actorName}</span> <span className="text-muted-foreground">{event.message}</span>
            </p>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              <RelativeTime date={event.createdAt} />
            </span>
          </div>
        );
        return (
          <li key={event.id} className="border-b last:border-b-0 transition-colors hover:bg-accent/40">
            {event.issueKey ? (
              <Link href={`/?issue=${event.issueKey}` as Route} prefetch={false}>
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <ul className="overflow-hidden rounded-lg border bg-card">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0">
          <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
          <Skeleton className="h-3 flex-1" style={{ maxWidth: `${40 + ((i * 13) % 40)}%` }} />
          <Skeleton className="h-2.5 w-10 shrink-0" />
        </li>
      ))}
    </ul>
  );
}
