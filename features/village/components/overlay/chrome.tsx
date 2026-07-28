'use client';

import { Users } from 'lucide-react';
import { useSWRConfig } from 'swr';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { RelativeTime } from '@/components/ui/relative-time';
import { cottageArt, housePalette, PixelSprite, ROOF } from '@/features/village/components/shared/pixel-sprite';
import { clampZoom } from '@/features/village/components/stage/player';
import { useVillageData } from '@/features/village/hooks/use-village-data';
import { useVillageUi } from '@/features/village/providers/village-ui-provider';
import { timeWindowFor, worldModelFor } from '@/features/village/utils/village-model';
import { cn } from '@/lib/utils';
import { villageKey } from '@/types/github';
import type { ReactNode } from 'react';

export function VillageBusy() {
  const { slug } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { mutate } = useSWRConfig();
  if (payload.ok) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 px-4">
      <div className="panel pixel pointer-events-auto relative flex max-w-sm flex-col items-center gap-4 rounded-sm p-6 text-center shadow-[8px_10px_0_rgb(0_0_0/0.35)]">
        <PixelSprite art={cottageArt(1, false)} palette={housePalette(...ROOF.pr, true)} scale={5} />
        <p className="text-[18px] leading-tight font-bold text-[#3a2f22] drop-shadow-[0_1px_0_rgb(255_255_255/0.35)]">
          the village is resting
        </p>
        <p className="max-w-xs text-[14px] leading-snug text-[#6b5b43]">
          GitHub is rate limiting us right now. Head back to the road, or come back in a minute.
        </p>
        <button
          type="button"
          onClick={() => mutate(villageKey(slug))}
          className="panel-wood mt-1 cursor-pointer rounded-sm px-3 py-1.5 text-[14px] font-bold text-[#f0e6d2] transition-transform hover:-translate-y-0.5"
        >
          try again
        </button>
      </div>
    </div>
  );
}

export function VillageStatus({ repoNav }: { repoNav: ReactNode }) {
  const { slug, scrub, focusId } = useVillageUi();
  const { payload, stale } = useVillageData(slug);
  const { asOf, live } = timeWindowFor(payload, scrub);
  const { actors } = worldModelFor(payload, slug, asOf);

  if (focusId) return null;

  return (
    <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
      {repoNav}
      {payload.ok ? (
        <p className="flex h-6 items-center gap-2 px-1 text-[14px] font-semibold text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.7)]">
          <span
            className={cn('h-2 w-2 rounded-full', live && !stale ? 'animate-pulse bg-[#58d06c]' : 'bg-[#e4c05a]')}
          />
          {stale ? (
            'rate limited, showing the last sync'
          ) : live ? (
            <>{actors.length} villagers about</>
          ) : (
            <span className="font-mono">
              viewing {new Date(asOf).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
              {new Date(asOf).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </p>
      ) : null}
    </div>
  );
}

export function VillageControls({ repoLink }: { repoLink: ReactNode }) {
  const { buzzOpen, setBuzzOpen, peopleOpen, setPeopleOpen, focusId, setZoom } = useVillageUi();
  return (
    <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5">
      {repoLink}
      {!focusId ? (
        <>
          <button
            type="button"
            onClick={() => setZoom(z => clampZoom(Math.round((z - 0.15) * 100) / 100))}
            aria-label="Zoom out to see more of the village"
            aria-keyshortcuts="Meta+- Control+-"
            title="Zoom out (⌘−)"
            className="panel flex h-9 w-12 cursor-pointer items-center justify-center gap-1 rounded-sm text-[16px] font-bold transition-transform hover:-translate-y-0.5"
          >
            <span aria-hidden>-</span>
            <KeyPin>⌘−</KeyPin>
          </button>
          <button
            type="button"
            onClick={() => setZoom(z => clampZoom(Math.round((z + 0.15) * 100) / 100))}
            aria-label="Zoom in"
            aria-keyshortcuts="Meta+= Control+="
            title="Zoom in (⌘+)"
            className="panel flex h-9 w-12 cursor-pointer items-center justify-center gap-1 rounded-sm text-[16px] font-bold transition-transform hover:-translate-y-0.5"
          >
            <span aria-hidden>+</span>
            <KeyPin>⌘+</KeyPin>
          </button>
          <button
            type="button"
            onClick={() => {
              setBuzzOpen(o => !o);
              setPeopleOpen(() => false);
            }}
            className={cn(
              'panel flex h-9 cursor-pointer items-center rounded-sm px-3 text-[14px] font-bold transition-transform hover:-translate-y-0.5',
              buzzOpen && 'brightness-90',
            )}
          >
            noticeboard
          </button>
          <button
            type="button"
            onClick={() => {
              setPeopleOpen(o => !o);
              setBuzzOpen(() => false);
            }}
            className={cn(
              'panel flex h-9 cursor-pointer items-center gap-1.5 rounded-sm px-3 text-[14px] font-bold transition-transform hover:-translate-y-0.5',
              peopleOpen && 'brightness-90',
            )}
          >
            <Users size={14} strokeWidth={3} /> people
          </button>
          <div className="panel flex h-9 items-center rounded-sm">
            <ThemeToggle />
          </div>
        </>
      ) : null}
    </div>
  );
}

function KeyPin({ children }: { children: ReactNode }) {
  return (
    <span className="font-pixel rounded-[2px] border border-[#4a3826] bg-[#f7efdc] px-0.5 text-[8px] leading-3 text-[#3a2f22]">
      {children}
    </span>
  );
}

export function VillageTooltip() {
  const { tip } = useVillageUi();
  if (!tip) return null;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const flipX = tip.x > vw * 0.62;
  const flipY = tip.y > vh * 0.6;
  return (
    <div
      className="panel pointer-events-none fixed z-50 max-w-96 rounded-sm px-3 py-2 [@media(hover:none)]:hidden"
      style={{
        left: flipX ? undefined : tip.x + 16,
        right: flipX ? vw - tip.x + 16 : undefined,
        top: flipY ? undefined : tip.y + 16,
        bottom: flipY ? vh - tip.y + 16 : undefined,
      }}
    >
      <p className="text-[14px] leading-tight font-bold">{tip.title}</p>
      {tip.body ? (
        <p className="mt-1 line-clamp-14 text-[13px] leading-snug whitespace-pre-line text-[#6b5b43]">{tip.body}</p>
      ) : null}
      {tip.when ? (
        <p className="mt-1 text-[12px] text-[#8a6d2a]">
          <RelativeTime date={tip.when} />
        </p>
      ) : null}
    </div>
  );
}
