'use client';

import { useHive } from '@/features/hive/hive-context';
import { RelativeTime } from '@/components/ui/relative-time';
import { cn } from '@/lib/utils';
import { KIND_EMOJI } from '@/features/hive/hive-world-model';
import type { WireEvent } from '@/types/github';

// The live ticker, floating as a glass panel. Rows past the scrubbed moment dim out.
export function BuzzPanel() {
  const { payload, asOf, buzzOpen, focusId } = useHive();
  if (!buzzOpen || focusId) return null;

  return (
    <aside className="absolute top-16 right-4 bottom-24 z-30 hidden w-72 flex-col overflow-hidden rounded-2xl border bg-background/70 shadow-2xl backdrop-blur-md sm:flex">
      <ul className="min-h-0 flex-1 overflow-y-auto py-1">
        {payload.events.slice(0, 40).map(e => (
          <BuzzRow key={e.id} event={e} dimmed={new Date(e.at).getTime() > asOf} />
        ))}
      </ul>
    </aside>
  );
}

function BuzzRow({ event, dimmed }: { event: WireEvent; dimmed: boolean }) {
  const inner = (
    <div className={cn('flex items-start gap-2.5 px-4 py-2 transition-opacity', dimmed && 'opacity-25')}>
      {event.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${event.avatar}?size=64`} alt="" width={18} height={18} className="mt-0.5 rounded-full" />
      ) : (
        <span className="mt-0.5 h-[18px] w-[18px] rounded-full bg-secondary" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs">
          <span className="font-medium">{event.actor}</span> <span className="text-muted-foreground">{event.line}</span>
        </p>
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
          {KIND_EMOJI[event.kind]} <RelativeTime date={event.at} />
        </p>
      </div>
    </div>
  );
  return (
    <li className="transition-colors hover:bg-accent/40">
      {event.url ? (
        <a href={event.url} target="_blank" rel="noreferrer">
          {inner}
        </a>
      ) : (
        inner
      )}
    </li>
  );
}
