'use client';

import { RelativeTime } from '@/components/ui/relative-time';
import { KindBadge } from '@/features/hive/components/pixel-sprite';
import { useHiveUi } from '@/features/hive/hive-ui-context';
import { useHiveData, useTimeWindow } from '@/features/hive/use-hive-data';
import { cn } from '@/lib/utils';
import type { WireEvent } from '@/types/github';

export function BuzzPanel() {
  const { slug, scrub, buzzOpen, focusId } = useHiveUi();
  const { payload } = useHiveData(slug);
  const { asOf } = useTimeWindow(payload, scrub);
  if (!buzzOpen || focusId) return null;

  return (
    <aside className="bg-background/80 absolute top-16 right-4 bottom-24 z-30 hidden w-72 flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-md sm:flex">
      <><p className="panel-wood font-pixel shrink-0 border-x-0 border-t-0 px-4 py-1.5 text-[14px] font-bold">the buzz</p><ul className="min-h-0 flex-1 overflow-y-auto py-1">
        {payload.events.slice(0, 40).map(e => (
          <BuzzRow key={e.id} event={e} dimmed={new Date(e.at).getTime() > asOf} />
        ))}
      </ul></>
    </aside>
  );
}

function BuzzRow({ event, dimmed }: { event: WireEvent; dimmed: boolean }) {
  const inner = (
    <div className={cn('flex items-start gap-2.5 px-4 py-2 transition-opacity', dimmed && 'opacity-30')}>
      {event.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${event.avatar}?size=64`} alt="" width={18} height={18} className="mt-0.5 rounded-full" />
      ) : (
        <span className="bg-secondary mt-0.5 h-[18px] w-[18px] rounded-full" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px]">
          <span className="font-bold text-[#3a2f22]">{event.actor}</span> <span className="text-[#6b5b43]">{event.line}</span>
        </p>
        <p className="flex items-center gap-1.5 text-[11px] text-[#8a6d2a]">
          <KindBadge kind={event.kind} /> <RelativeTime date={event.at} />
        </p>
      </div>
    </div>
  );
  return (
    <li className="transition-colors hover:bg-black/5">
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
