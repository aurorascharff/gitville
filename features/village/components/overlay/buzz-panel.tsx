'use client';

import { ArrowUpRight } from 'lucide-react';
import { AvatarImage } from '@/components/ui/avatar-image';
import { RelativeTime } from '@/components/ui/relative-time';
import { KindBadge } from '@/features/village/components/shared/pixel-sprite';
import { travelTo } from '@/features/village/components/stage/player';
import { useVillageData } from '@/features/village/hooks/use-village-data';
import { useVillageUi } from '@/features/village/providers/village-ui-provider';
import { cellForEvent, timeWindowFor, worldModelFor, type Cell } from '@/features/village/utils/village-model';
import { cn } from '@/lib/utils';
import type { WireEvent } from '@/types/github';

export function BuzzPanel() {
  const { slug, scrub, buzzOpen, focusId } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = timeWindowFor(payload, scrub);
  const { cells } = worldModelFor(payload, slug, asOf);
  if (!buzzOpen || focusId || !payload.ok) return null;

  return (
    <aside className="panel absolute top-16 right-4 bottom-24 z-30 hidden w-80 flex-col overflow-hidden rounded-sm sm:flex">
      <p className="panel-wood shrink-0 border-x-0 border-t-0 px-4 py-2 text-[15px] font-bold">noticeboard</p>
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

export function PeoplePanel() {
  const { slug, scrub, peopleOpen, focusId } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = timeWindowFor(payload, scrub);
  const { actors, cells } = worldModelFor(payload, slug, asOf);
  if (!peopleOpen || focusId || !payload.ok) return null;

  return (
    <aside className="panel absolute top-16 right-4 bottom-24 z-30 hidden w-80 flex-col overflow-hidden rounded-sm sm:flex">
      <p className="panel-wood shrink-0 border-x-0 border-t-0 px-4 py-2 text-[15px] font-bold">people</p>
      <ul className="min-h-0 flex-1 overflow-y-auto py-1">
        {actors.map(actor => {
          const cell = visibleCell(cells, actor.cellId);
          return <PeopleRow key={actor.login} actor={actor} cell={cell} />;
        })}
      </ul>
    </aside>
  );
}

function BuzzRow({ event, cell, dimmed }: { event: WireEvent; cell: Cell | null; dimmed: boolean }) {
  return (
    <li className="transition-colors hover:bg-black/5">
      <div className={cn('flex items-start gap-2.5 px-4 py-2.5 transition-opacity', dimmed && 'opacity-30')}>
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
            size={22}
            className="mt-0.5 rounded-full"
          >
            {null}
          </AvatarImage>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px]">
              <span className="font-bold text-[#3a2f22]">{event.actor}</span>{' '}
              <span className="text-[#6b5b43]">{event.line}</span>
            </span>
            <span className="mt-1 flex items-center gap-1.5 text-[12px] text-[#8a6d2a]">
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

type Actor = ReturnType<typeof worldModelFor>['actors'][number];

function visibleCell(cells: Cell[], cellId: string): Cell | null {
  const cell = cells.find(c => c.id === cellId);
  if (!cell?.hidden) return cell ?? null;
  return cells.find(c => !c.hidden && c.x === cell.x && c.y === cell.y) ?? cell;
}

function PeopleRow({ actor, cell }: { actor: Actor; cell: Cell | null }) {
  return (
    <li className="transition-colors hover:bg-black/5">
      <div className="flex items-start gap-2.5 px-4 py-2.5">
        <button
          type="button"
          disabled={!cell}
          onClick={() => cell && travelTo({ x: cell.x, y: cell.y + 44, cellId: cell.id })}
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 text-left disabled:cursor-default"
          aria-label={cell ? `Walk to ${actor.login} at ${cell.label}` : undefined}
        >
          <AvatarImage
            src={actor.avatar ? `${actor.avatar}?size=64` : null}
            name={actor.login}
            alt=""
            size={24}
            className="mt-0.5 rounded-full"
          >
            {null}
          </AvatarImage>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-bold text-[#3a2f22]">{actor.login}</span>
            <span className="mt-0.5 block truncate text-[13px] text-[#6b5b43]">
              {cell ? `at ${cell.label}` : 'between houses'}
              {cell?.sub ? ` · ${cell.sub}` : ''}
            </span>
            <span className="mt-1 flex items-center gap-1.5 text-[12px] text-[#8a6d2a]">
              <KindBadge kind={actor.event.kind} /> <RelativeTime date={actor.event.at} />
            </span>
          </span>
        </button>
        {actor.event.url ? (
          <a
            href={actor.event.url}
            target="_blank"
            rel="noreferrer"
            aria-label="Open latest activity on GitHub"
            className="mt-1 shrink-0 text-[#8a6d2a] transition-colors hover:text-[#3a2f22]"
          >
            <ArrowUpRight size={14} strokeWidth={3} />
          </a>
        ) : null}
      </div>
    </li>
  );
}
