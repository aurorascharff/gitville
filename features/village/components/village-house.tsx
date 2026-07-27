'use client';

import { cabinArt, cottageArt, hallArt, housePalette, lampArt, lampPalette, nightenPalette, PixelSprite, tentArt, WELL } from '@/features/village/components/pixel-sprite';
import { travelTo } from '@/features/village/components/player';
import { preloadRoomSpec } from '@/features/village/use-village-data';
import type { Cell } from '@/features/village/village-model';
import { useVillageUi } from '@/features/village/village-ui-context';

const ROOFS: Record<Cell['kind'], [string, string]> = {
  main: ['#3b6bff', '#2b4fc4'],
  pr: ['#c85b5b', '#9d4444'],
  branch: ['#b0532e', '#8a4023'],
  issue: ['#8a6a9d', '#6b5279'],
  inbox: ['#7d8590', '#5f656e'],
};

function stateLine(cell: Cell): string | null {
  if (cell.kind !== 'pr') return null;
  if (cell.prState === 'stacked') return `stacked on #${cell.stackedOn}${cell.draft ? ' · draft' : ''}`;
  if (cell.prState === 'draft') return 'draft — under construction';
  return 'ready for review';
}

export function VillageHouse({ cell, people }: { cell: Cell; people: number }) {
  const { slug, focusId, setFocusId, setTip } = useVillageUi();
  const lit = people > 0;
  const main = cell.kind === 'main';
  const [roof, roofShade] = ROOFS[cell.kind];
  const palette = housePalette(roof, roofShade, lit);
  const state = stateLine(cell);

  return (
    <button
      type="button"
      onClick={() => {
        if (focusId === cell.id) setFocusId(null);
        else {
          preloadRoomSpec(slug, cell.id);
          travelTo({ x: cell.x, y: cell.y + 44, cellId: cell.id });
        }
      }}
      onMouseEnter={() => preloadRoomSpec(slug, cell.id)}
      onMouseMove={e =>
        setTip({ x: e.clientX, y: e.clientY, title: cell.label, body: [state, cell.sub].filter(Boolean).join(' — ') || null, when: null })
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
            <span className="border-l-brand h-0 w-0 border-y-[5px] border-l-8 border-y-transparent" style={{ transform: 'translate(9px, 2px)' }} />
            <span className="h-6 w-0.5 bg-[#2e2418]" />
          </span>
        ) : null}

        {cell.kind === 'pr' && cell.prState !== 'draft' && lit ? <ChimneySmoke /> : null}

        {/* One pixel size everywhere — a bigger building means more art, not fatter pixels. */}
        {cell.kind === 'inbox' ? (
          <DayNightSprite art={WELL.art} palette={WELL.palette} scale={5} lit={lit} />
        ) : main ? (
          <DayNightSprite art={hallArt()} palette={palette} scale={5} lit={lit} />
        ) : cell.kind === 'branch' ? (
          <DayNightSprite art={cabinArt()} palette={palette} scale={5} lit={lit} />
        ) : cell.kind === 'issue' ? (
          <DayNightSprite art={tentArt()} palette={palette} scale={5} lit={lit} />
        ) : (
          <DayNightSprite art={cottageArt(cell.floors ?? 1, Boolean(cell.draft))} palette={palette} scale={5} lit={lit} />
        )}

        <div className="mt-1.5 flex max-w-48 flex-col items-center rounded-sm border-2 border-[#2e2418] bg-[#f0e6d2] px-1.5 py-0.5 text-center shadow-[2px_2px_0_rgb(0_0_0/0.3)]">
          <p className="font-pixel w-full truncate text-[13px] leading-4 font-bold text-[#3a2f22]">
            {cell.label}
            {cell.prState === 'stacked' ? <span className="text-[#8a6d2a]"> ⌂{cell.floors}</span> : null}
            {cell.draft ? <span className="font-normal text-[#8a6d2a]"> · draft</span> : null}
          </p>
          {cell.sub && !main ? <p className="line-clamp-1 w-full text-[10px] leading-tight text-[#6b5b43]">{cell.sub}</p> : null}
        </div>

        {people > 0 ? (
          <span className="bg-brand text-brand-foreground font-pixel absolute -top-2 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-sm border-2 border-[#2e2418] px-1 text-[11px] font-bold">
            {people}
          </span>
        ) : (
          <span aria-hidden className="zzz font-pixel pointer-events-none absolute -top-7 right-2 hidden flex-col items-end text-white/90 dark:flex">
            <span className="text-[14px]">z</span>
            <span className="text-[11px]">z</span>
          </span>
        )}
      </div>
    </button>
  );
}

// At night the same sprite renders with a cold palette; lit windows stay warm.
function DayNightSprite({ art, palette, scale, lit }: { art: string[]; palette: Record<string, string>; scale: number; lit: boolean }) {
  return (
    <>
      <span className="block dark:hidden">
        <PixelSprite art={art} palette={palette} scale={scale} />
      </span>
      <span className="hidden dark:block">
        <PixelSprite art={art} palette={nightenPalette(palette, lit ? ['q'] : [])} scale={scale} />
      </span>
    </>
  );
}

// The chimney sits at ~21% from the sprite's right edge, so the puffs do too.
function ChimneySmoke() {
  return (
    <span aria-hidden className="pointer-events-none absolute -top-1 right-[21%] z-10">
      {[0, 1, 2].map(i => (
        <span key={i} className="smoke-puff absolute h-2 w-2 rounded-full bg-white/70" style={{ animationDelay: `${i * 1100}ms` }} />
      ))}
    </span>
  );
}

export function VillageLamp({ x, y }: { x: number; y: number }) {
  return (
    <span aria-hidden className="pixel absolute" style={{ left: x, top: y, transform: 'translate(-50%, -88%)' }}>
      <span className="hidden dark:block">
        <PixelSprite art={lampArt()} palette={lampPalette(true)} scale={4} />
      </span>
      <span className="block dark:hidden">
        <PixelSprite art={lampArt()} palette={lampPalette(false)} scale={4} />
      </span>
    </span>
  );
}
