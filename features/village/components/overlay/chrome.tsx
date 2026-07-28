'use client';

import { AlertTriangle, Minus, Newspaper, Plus, RefreshCw, Users } from 'lucide-react';
import { useSWRConfig } from 'swr';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { RelativeTime } from '@/components/ui/relative-time';
import { cottageArt, housePalette, PixelSprite, ROOF } from '@/features/village/components/shared/pixel-sprite';
import { clampZoom } from '@/features/village/components/stage/player';
import { fetchVillagePayload, useVillageData } from '@/features/village/hooks/use-village-data';
import { useVillageUi } from '@/features/village/providers/village-ui-provider';
import { timeWindowFor, worldModelFor } from '@/features/village/utils/village-model';
import { cn } from '@/lib/utils';
import { villageKey, villageRefreshKey } from '@/types/github';
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
          GitHub is rate limiting this village. Try again in a minute.
        </p>
        <button
          type="button"
          onClick={() => mutate(villageKey(slug), fetchVillagePayload(villageRefreshKey(slug)), { revalidate: false })}
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
    <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 z-30 flex max-w-[calc(100vw-6.5rem)] flex-col gap-1.5 sm:top-4 sm:left-4 sm:max-w-none sm:gap-2">
      {repoNav}
      {payload.ok ? (
        <p className="flex h-5 min-w-0 items-center gap-1.5 px-1 text-[12px] font-semibold text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.7)] sm:h-6 sm:gap-2 sm:text-[14px]">
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              live && !stale ? 'animate-pulse bg-[#58d06c]' : 'bg-[#e4c05a]',
            )}
          />
          {stale ? (
            <span className="truncate">rate limited</span>
          ) : live ? (
            <span className="truncate">{actors.length} villagers</span>
          ) : (
            <span className="truncate font-mono">
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
  const { slug, buzzOpen, setBuzzOpen, peopleOpen, setPeopleOpen, focusId, setZoom } = useVillageUi();
  const { payload, stale, validating } = useVillageData(slug);
  const { mutate } = useSWRConfig();
  const retrying = stale || !payload.ok;
  return (
    <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-30 flex max-w-[calc(100vw-1.5rem)] items-center gap-1 sm:top-4 sm:right-4 sm:gap-1.5">
      {repoLink}
      <button
        type="button"
        onClick={() => mutate(villageKey(slug), fetchVillagePayload(villageRefreshKey(slug)), { revalidate: false })}
        disabled={validating}
        aria-label={validating ? 'Refreshing village' : retrying ? 'Retry village sync' : 'Refresh village'}
        title={validating ? 'Refreshing village' : retrying ? 'Retry village sync' : 'Refresh village'}
        className="panel relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm transition-transform hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-80 disabled:hover:translate-y-0 sm:h-9 sm:w-9"
      >
        <RefreshCw className={cn(validating && 'animate-spin')} size={14} strokeWidth={3} />
        {retrying ? (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-sm border border-[#2e2418] bg-[#e4c05a] text-[#3a2f22]">
            <AlertTriangle size={10} strokeWidth={3} />
          </span>
        ) : null}
      </button>
      {!focusId ? (
        <>
          <button
            type="button"
            onClick={() => setZoom(z => clampZoom(Math.round((z - 0.15) * 100) / 100))}
            aria-label="Zoom out to see more of the village"
            aria-keyshortcuts="Meta+- Control+-"
            className="panel hidden h-9 w-9 cursor-pointer items-center justify-center rounded-sm text-[16px] font-bold transition-transform hover:-translate-y-0.5 sm:flex"
          >
            <Minus size={15} strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => setZoom(z => clampZoom(Math.round((z + 0.15) * 100) / 100))}
            aria-label="Zoom in"
            aria-keyshortcuts="Meta+= Control+="
            className="panel hidden h-9 w-9 cursor-pointer items-center justify-center rounded-sm text-[16px] font-bold transition-transform hover:-translate-y-0.5 sm:flex"
          >
            <Plus size={15} strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => {
              setBuzzOpen(o => !o);
              setPeopleOpen(() => false);
            }}
            aria-label="Open noticeboard"
            className={cn(
              'panel flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm text-[14px] font-bold transition-transform hover:-translate-y-0.5 sm:h-9 sm:w-auto sm:px-3',
              buzzOpen && 'brightness-90',
            )}
          >
            <Newspaper className="sm:hidden" size={14} strokeWidth={3} />
            <span className="hidden sm:inline">noticeboard</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPeopleOpen(o => !o);
              setBuzzOpen(() => false);
            }}
            aria-label="Open people"
            className={cn(
              'panel flex h-8 w-8 cursor-pointer items-center justify-center gap-1.5 rounded-sm text-[14px] font-bold transition-transform hover:-translate-y-0.5 sm:h-9 sm:w-auto sm:px-3',
              peopleOpen && 'brightness-90',
            )}
          >
            <Users size={14} strokeWidth={3} />
            <span className="hidden sm:inline">people</span>
          </button>
          <div className="panel hidden h-9 items-center rounded-sm sm:flex">
            <ThemeToggle />
          </div>
        </>
      ) : null}
    </div>
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
