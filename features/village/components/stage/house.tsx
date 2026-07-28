'use client';

import useSWR from 'swr';
import { AvatarImage } from '@/components/ui/avatar-image';
import {
  cabinArt,
  cottageArt,
  DayNight,
  hallArt,
  housePalette,
  lampArt,
  lampPalette,
  nightenPalette,
  PixelSprite,
  ROOF,
  tentArt,
  WELL,
} from '@/features/village/components/shared/pixel-sprite';
import { Placed } from '@/features/village/components/shared/placed';
import { travelTo } from '@/features/village/components/stage/player';
import { preloadRoomSpec, roomSpecKey, type RoomSpecPayload } from '@/features/village/hooks/use-village-data';
import { useVillageUi } from '@/features/village/providers/village-ui-provider';
import type { Cell } from '@/features/village/utils/village-model';

function stateLine(cell: Cell): string | null {
  if (cell.kind !== 'pr') return null;
  if (cell.conflict) return 'has merge conflicts, roadwork outside';
  if (cell.prState === 'stacked')
    return `a stack of ${cell.floors} PRs${cell.draft ? ', top floor still a draft' : ''}`;
  if (cell.prState === 'draft') return 'a draft, still under construction';
  if (cell.checkState === 'FAILURE' || cell.checkState === 'ERROR') return 'checks need attention';
  if (cell.reviewDecision === 'APPROVED') return 'approved and ready';
  if (cell.stale) return 'quiet for a while, moss is taking over';
  return 'ready for review';
}

export function VillageHouse({ cell, people }: { cell: Cell; people: number }) {
  const { slug, focusId, setFocusId, setTip } = useVillageUi();
  const lit = people > 0;
  const main = cell.kind === 'main';
  const [roof, roofShade] = ROOF[cell.kind];
  const palette = housePalette(roof, roofShade, lit);
  const state = stateLine(cell);
  const peopleToShow = [...(cell.reviewers ?? []), ...(cell.assignees ?? [])].slice(0, 3);
  const { data: aiSpec } = useSWR<RoomSpecPayload>(cell.kind === 'pr' ? roomSpecKey(slug, cell.id, true) : null, null, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnMount: false,
  });

  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => {
        if (focusId === cell.id) setFocusId(null);
        else {
          preloadRoomSpec(slug, cell.id);
          travelTo({ x: cell.x, y: cell.y + 44, cellId: cell.id });
        }
      }}
      onMouseEnter={() => preloadRoomSpec(slug, cell.id)}
      onMouseMove={e =>
        setTip({
          x: e.clientX,
          y: e.clientY,
          title: cell.label,
          body: [state, cell.sub].filter(Boolean).join(', ') || null,
          when: null,
        })
      }
      onMouseLeave={() => setTip(null)}
      aria-label={`Enter ${cell.label}`}
      className="group absolute block cursor-pointer transition-transform duration-300 hover:-translate-y-1"
      style={{
        left: cell.x,
        top: cell.y,
        transform: 'translate(-50%, -62%)',
        filter: lit
          ? 'drop-shadow(4px 6px 0 rgb(0 0 0 / 0.25)) drop-shadow(0 0 18px rgb(255 214 106 / 0.35))'
          : 'drop-shadow(4px 6px 0 rgb(0 0 0 / 0.25))',
      }}
    >
      <div className="pixel relative flex flex-col items-center">
        {main ? (
          <span aria-hidden className="absolute -top-7 left-1/2 flex -translate-x-1/2 flex-col items-center">
            <span
              className="border-l-brand h-0 w-0 border-y-[5px] border-l-8 border-y-transparent"
              style={{ transform: 'translate(9px, 2px)' }}
            />
            <span className="h-6 w-0.5 bg-[#2e2418]" />
          </span>
        ) : null}

        {main && cell.versions?.length ? <TownHallBanners cell={cell} /> : null}
        {cell.kind === 'pr' && cell.stale ? <Moss /> : null}
        {cell.kind === 'pr' && cell.checkState ? <CheckFlag state={cell.checkState} /> : null}
        {aiSpec?.ok && aiSpec.ai ? <AiExteriorDecor theme={aiSpec.theme} title={aiSpec.title ?? cell.sub} /> : null}
        {cell.kind === 'pr' && cell.prState === 'ready' && (cell.floors ?? 1) === 1 && lit ? <ChimneySmoke /> : null}

        {cell.kind === 'inbox' ? (
          <DayNightSprite art={WELL.art} palette={WELL.palette} scale={5} lit={lit} />
        ) : main ? (
          <DayNightSprite art={hallArt()} palette={palette} scale={cell.scale ?? 5} lit={lit} />
        ) : cell.kind === 'branch' ? (
          <DayNightSprite art={cabinArt()} palette={palette} scale={5} lit={lit} />
        ) : cell.kind === 'issue' ? (
          <DayNightSprite art={tentArt()} palette={palette} scale={5} lit={lit} />
        ) : (
          <DayNightSprite
            art={cottageArt(cell.floors ?? 1, Boolean(cell.draft))}
            palette={palette}
            scale={5}
            lit={lit}
          />
        )}

        <div className="mt-1.5 flex max-w-48 flex-col items-center rounded-sm border-2 border-[#2e2418] bg-[#f0e6d2] px-1.5 py-0.5 text-center shadow-[2px_2px_0_rgb(0_0_0/0.3)]">
          <p className="font-pixel w-full truncate text-[13px] leading-4 font-bold text-[#3a2f22]">
            {cell.label}
            {cell.prState === 'stacked' ? <span className="text-[#8a6d2a]"> ⌂{cell.floors}</span> : null}
            {cell.draft ? <span className="font-normal text-[#8a6d2a]"> draft</span> : null}
          </p>
          {cell.sub && !main ? (
            <p className="line-clamp-1 w-full text-[10px] leading-tight text-[#6b5b43]">{cell.sub}</p>
          ) : null}
        </div>

        {people > 0 ? (
          <span className="bg-brand text-brand-foreground font-pixel absolute -top-2 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-sm border-2 border-[#2e2418] px-1 text-[11px] font-bold">
            {people}
          </span>
        ) : (
          <span
            aria-hidden
            className="zzz font-pixel pointer-events-none absolute -top-7 right-2 hidden flex-col items-end text-white/90 dark:flex"
          >
            <span className="text-[14px]">z</span>
            <span className="text-[11px]">z</span>
          </span>
        )}
        {cell.kind === 'pr' && peopleToShow.length > 0 ? (
          <Mailbox reviewers={cell.reviewers ?? []} assignees={cell.assignees ?? []} />
        ) : null}
      </div>
    </button>
  );
}

function AiExteriorDecor({ theme, title }: { theme: string; title: string | null }) {
  const { setTip } = useVillageUi();
  const text = `${theme} ${title ?? ''}`;
  const kind = /test|lab|root|detect|debug|trace|verify|check/i.test(text)
    ? 'lab'
    : /design|css|ui|style|paint|theme/i.test(text)
      ? 'studio'
      : /cache|perf|speed|turbo|build|compile/i.test(text)
        ? 'machine'
        : 'garden';
  const label =
    kind === 'lab'
      ? 'detection lab'
      : kind === 'studio'
        ? 'design studio'
        : kind === 'machine'
          ? 'machine shop'
          : 'AI garden';

  return (
    <span
      title={label}
      onMouseMove={e => {
        e.stopPropagation();
        setTip({
          x: e.clientX,
          y: e.clientY,
          title: label,
          body: `AI decorated this house from the cached "${theme}" room.`,
          when: null,
        });
      }}
      onMouseLeave={e => {
        e.stopPropagation();
        setTip(null);
      }}
      className="absolute -right-11 bottom-13 z-10 flex items-end"
    >
      {kind === 'lab' ? (
        <LabSign />
      ) : kind === 'studio' ? (
        <PaintSign />
      ) : kind === 'machine' ? (
        <MachineSign />
      ) : (
        <GardenSign />
      )}
    </span>
  );
}

function LabSign() {
  return (
    <span className="pixel relative block h-11 w-10">
      <span className="absolute bottom-0 left-4 h-7 w-1 bg-[#4a3826]" />
      <span className="absolute top-0 left-0 h-6 w-10 border-2 border-[#2e2418] bg-[#8fd0c0] shadow-[2px_2px_0_rgb(0_0_0/0.25)]">
        <span className="absolute top-1 left-1 h-2 w-2 bg-[#f7efdc]" />
        <span className="absolute top-1 right-1 h-2 w-2 bg-[#e4c05a]" />
        <span className="absolute bottom-1 left-3 h-1 w-4 bg-[#2e2418]" />
      </span>
    </span>
  );
}

function PaintSign() {
  return (
    <span className="pixel relative block h-10 w-10">
      <span className="absolute bottom-0 left-5 h-6 w-1 bg-[#4a3826]" />
      <span className="absolute top-0 left-1 h-6 w-8 border-2 border-[#2e2418] bg-[#f7efdc] shadow-[2px_2px_0_rgb(0_0_0/0.25)]">
        <span className="absolute top-1 left-1 h-2 w-2 bg-[#c85b5b]" />
        <span className="absolute top-1 left-4 h-2 w-2 bg-[#3b6bff]" />
        <span className="absolute top-3 left-2 h-2 w-4 bg-[#58a55c]" />
      </span>
    </span>
  );
}

function MachineSign() {
  return (
    <span className="pixel relative block h-11 w-11">
      <span className="absolute bottom-0 left-5 h-5 w-1 bg-[#4a3826]" />
      <span className="absolute top-1 left-1 h-8 w-9 border-2 border-[#2e2418] bg-[#9aa0a8] shadow-[2px_2px_0_rgb(0_0_0/0.25)]">
        <span className="absolute top-1 left-1 h-2 w-5 bg-[#3b6bff]" />
        <span className="absolute right-1 bottom-1 h-2 w-2 bg-[#e4c05a]" />
        <span className="absolute bottom-1 left-1 h-1 w-4 bg-[#2e2418]" />
      </span>
    </span>
  );
}

function GardenSign() {
  return (
    <span className="pixel relative block h-11 w-10">
      <span className="absolute bottom-0 left-5 h-5 w-1 bg-[#4a3826]" />
      <span className="absolute top-1 left-2 h-7 w-7 border-2 border-[#2e2418] bg-[#58a55c] shadow-[2px_2px_0_rgb(0_0_0/0.25)]">
        <span className="absolute top-1 left-2 h-2 w-2 bg-[#f7efdc]" />
        <span className="absolute right-1 bottom-1 h-2 w-2 bg-[#e4c05a]" />
      </span>
    </span>
  );
}

function TownHallBanners({ cell }: { cell: Cell }) {
  const { setTip } = useVillageUi();
  const colors = {
    stable: 'bg-[#58a55c] text-[#0e2410]',
    preview: 'bg-[#e4c05a] text-[#3a2f22]',
    canary: 'bg-[#a986bd] text-[#1c1424]',
  };

  return (
    <span className="absolute -top-16 left-1/2 flex -translate-x-1/2 gap-1">
      {cell.versions?.map(version => (
        <span
          key={version.channel}
          title={`${version.channel}: ${version.name}`}
          onMouseMove={e => {
            e.stopPropagation();
            setTip({
              x: e.clientX,
              y: e.clientY,
              title: `${version.channel === 'stable' ? 'current' : version.channel} version`,
              body: version.name,
              when: version.at,
            });
          }}
          onMouseLeave={e => {
            e.stopPropagation();
            setTip(null);
          }}
          className={`font-pixel rounded-sm border-2 border-[#2e2418] px-1.5 py-0.5 text-[9px] font-bold shadow-[2px_2px_0_rgb(0_0_0/0.25)] ${colors[version.channel]}`}
        >
          {version.channel === 'stable' ? 'current' : version.channel}
        </span>
      ))}
    </span>
  );
}

function Moss() {
  const { setTip } = useVillageUi();
  return (
    <span
      aria-hidden
      title="quiet for a while"
      onMouseMove={e => {
        e.stopPropagation();
        setTip({
          x: e.clientX,
          y: e.clientY,
          title: 'stale branch',
          body: 'This PR has been quiet for more than two weeks, so moss is growing on the house.',
          when: null,
        });
      }}
      onMouseLeave={e => {
        e.stopPropagation();
        setTip(null);
      }}
      className="absolute top-8 left-1/2 z-10 flex -translate-x-1/2 gap-1"
    >
      <span className="h-2 w-7 bg-[#2f6a3b]" />
      <span className="mt-1 h-2 w-4 bg-[#3f8150]" />
      <span className="h-2 w-5 bg-[#265932]" />
    </span>
  );
}

function CheckFlag({ state }: { state: NonNullable<Cell['checkState']> }) {
  const { setTip } = useVillageUi();
  const color = state === 'SUCCESS' ? '#58a55c' : state === 'PENDING' || state === 'EXPECTED' ? '#e4c05a' : '#d95c4a';
  const label = checkLabel(state);

  return (
    <span
      aria-hidden
      title={`checks ${label}`}
      onMouseMove={e => {
        e.stopPropagation();
        setTip({
          x: e.clientX,
          y: e.clientY,
          title: 'CI checks',
          body: `The latest check status is ${label}.`,
          when: null,
        });
      }}
      onMouseLeave={e => {
        e.stopPropagation();
        setTip(null);
      }}
      className="absolute -top-8 right-2 z-10 flex flex-col items-center"
    >
      <span className="h-5 w-0.5 bg-[#2e2418]" />
      <span
        className="h-3 w-5 border-2 border-[#2e2418]"
        style={{ backgroundColor: color, transform: 'translate(8px, -18px)' }}
      />
    </span>
  );
}

function Mailbox({
  reviewers,
  assignees,
}: {
  reviewers: NonNullable<Cell['reviewers']>;
  assignees: NonNullable<Cell['assignees']>;
}) {
  const { setTip } = useVillageUi();
  const people = [...reviewers, ...assignees].slice(0, 3);
  const body = [
    reviewers.length ? `Review requested: ${reviewers.map(person => person.login).join(', ')}` : null,
    assignees.length ? `Assigned: ${assignees.map(person => person.login).join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <span
      title={body}
      onMouseMove={e => {
        e.stopPropagation();
        setTip({
          x: e.clientX,
          y: e.clientY,
          title: 'mailbox',
          body,
          when: null,
        });
      }}
      onMouseLeave={e => {
        e.stopPropagation();
        setTip(null);
      }}
      className="absolute right-[-34px] bottom-7 z-10 flex flex-col items-center gap-0.5"
    >
      <span className="relative h-5 w-6 rounded-t-sm border-2 border-[#2e2418] bg-[#8fd0c0] shadow-[2px_2px_0_rgb(0_0_0/0.25)]">
        <span className="absolute top-1 left-1 h-1 w-3 bg-[#2e2418]" />
        <span className="absolute top-1 right-0 h-3 w-1 bg-[#d95c4a]" />
      </span>
      <span className="flex -space-x-1">
        {people.map(person => (
          <AvatarImage
            key={person.login}
            src={person.avatar}
            name={person.login}
            alt=""
            size={16}
            className="rounded-full border border-[#2e2418]"
          />
        ))}
      </span>
    </span>
  );
}

function checkLabel(state: NonNullable<Cell['checkState']>): string {
  if (state === 'SUCCESS') return 'passing';
  if (state === 'PENDING' || state === 'EXPECTED') return 'running';
  return 'failing';
}

function DayNightSprite({
  art,
  palette,
  scale,
  lit,
}: {
  art: string[];
  palette: Record<string, string>;
  scale: number;
  lit: boolean;
}) {
  return (
    <DayNight
      day={<PixelSprite art={art} palette={palette} scale={scale} />}
      night={<PixelSprite art={art} palette={nightenPalette(palette, lit ? ['q'] : [])} scale={scale} />}
    />
  );
}

function ChimneySmoke() {
  return (
    <span aria-hidden className="pointer-events-none absolute -top-1 right-[21%] z-10">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="smoke-puff absolute h-2 w-2 rounded-full bg-white/70"
          style={{ animationDelay: `${i * 1100}ms` }}
        />
      ))}
    </span>
  );
}

export function VillageLamp({ x, y }: { x: number; y: number }) {
  return (
    <Placed x={x} y={y} anchor={[-50, -88]} className="pixel">
      <DayNight
        day={<PixelSprite art={lampArt()} palette={lampPalette(false)} scale={4} />}
        night={<PixelSprite art={lampArt()} palette={lampPalette(true)} scale={4} />}
      />
    </Placed>
  );
}
