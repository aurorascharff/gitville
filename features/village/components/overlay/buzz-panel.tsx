'use client';

import { ArrowUpRight } from 'lucide-react';
import { AvatarImage } from '@/components/ui/avatar-image';
import { RelativeTime } from '@/components/ui/relative-time';
import { KindBadge } from '@/features/village/components/shared/pixel-sprite';
import { travelTo } from '@/features/village/components/stage/player';
import { useVillageData, useTimeWindow, useWorldModel } from '@/features/village/use-village-data';
import { cellForEvent, type Cell } from '@/features/village/village-model';
import { useVillageUi } from '@/features/village/village-ui-context';
import { cn } from '@/lib/utils';
import type { WireEvent } from '@/types/github';

export function BuzzPanel() {
  const { slug, scrub, buzzOpen, focusId } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = useTimeWindow(payload, scrub);
  const { cells } = useWorldModel(payload, slug, asOf);
  if (!buzzOpen || focusId || !payload.ok) return null;

  return (
    <aside className="panel absolute top-16 right-4 bottom-24 z-30 hidden w-72 flex-col overflow-hidden rounded-sm sm:flex">
      <p className="panel-wood font-pixel shrink-0 border-x-0 border-t-0 px-4 py-1.5 text-[14px] font-bold">
        noticeboard
      </p>
      <ul className="min-h-0 flex-1 overflow-y-auto py-1">
        {payload.events.slice(0, 40).map(e => (
          <BuzzRow
            key={e.id}
            event={e}
            cell={cells.find(c => c.id === cellForEvent(e, cells, payload.defaultBranch)) ?? null}
            dimmed={new Date(e.at).getTime() > asOf}
          />
        ))}
      </ul>
    </aside>
  );
}

function BuzzRow({ event, cell, dimmed }: { event: WireEvent; cell: Cell | null; dimmed: boolean }) {
  return (
    <li className="transition-colors hover:bg-black/5">
      <div className={cn('flex items-start gap-2.5 px-4 py-2 transition-opacity', dimmed && 'opacity-30')}>
        <button
          type="button"
          disabled={!cell}
          onClick={() => cell && travelTo({ x: cell.x, y: cell.y + 44 })}
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 text-left disabled:cursor-default"
          aria-label={cell ? `Walk to ${cell.label}` : undefined}
        >
          <AvatarImage
            src={event.avatar ? `${event.avatar}?size=64` : null}
            name={event.actor}
            alt=""
            size={18}
            className="mt-0.5 rounded-full"
          >
            {null}
          </AvatarImage>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px]">
              <span className="font-bold text-[#3a2f22]">{event.actor}</span>{' '}
              <span className="text-[#6b5b43]">{event.line}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-[#8a6d2a]">
              <KindBadge kind={event.kind} /> <RelativeTime date={event.at} />
              {cell ? <span className="truncate">in {cell.label}</span> : null}
            </span>
          </span>
        </button>
        {event.url ? (
          <a
            href={event.url}
            target="_blank"
            rel="noreferrer"
            aria-label="Open on GitHub"
            className="mt-0.5 shrink-0 text-[#8a6d2a] transition-colors hover:text-[#3a2f22]"
          >
            <ArrowUpRight size={13} strokeWidth={3} />
          </a>
        ) : null}
      </div>
    </li>
  );
}
