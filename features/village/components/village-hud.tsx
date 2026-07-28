'use client';

import { Star } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { RelativeTime } from '@/components/ui/relative-time';
import { RepoSwitcher } from '@/features/repo/components/repo-switcher';
import { clampZoom } from '@/features/village/components/player';
import { useVillageData, useTimeWindow, useWorldModel } from '@/features/village/use-village-data';
import { useVillageUi } from '@/features/village/village-ui-context';
import { cn, formatStars } from '@/lib/utils';

export function VillageStatus() {
  const { slug, repo, pinned, scrub } = useVillageUi();
  const { payload, stale } = useVillageData(slug);
  const { asOf, live } = useTimeWindow(payload, scrub);
  const { actors } = useWorldModel(payload, slug, asOf);

  return (
    <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
      <RepoSwitcher repo={repo} pinned={pinned} />
      {payload.ok ? (
        <p className="font-pixel flex h-6 items-center gap-2 px-1 text-[13px] text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.7)]">
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

export function VillageControls() {
  const { repo, buzzOpen, setBuzzOpen, focusId, setZoom } = useVillageUi();
  return (
    <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5">
      <a
        href={`https://github.com/${repo.slug}`}
        target="_blank"
        rel="noreferrer"
        className="panel font-pixel flex h-9 items-center gap-1.5 rounded-sm px-3 text-[13px] font-bold transition-transform hover:-translate-y-0.5"
      >
        <Star size={12} className="fill-[#e4c05a] text-[#8a6d2a]" /> {formatStars(repo.stars)}
      </a>
      {!focusId ? (
        <>
          <button
            onClick={() => setZoom(z => clampZoom(Math.round((z - 0.15) * 100) / 100))}
            aria-label="Zoom out to see more of the village"
            className="panel font-pixel flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm text-[15px] font-bold transition-transform hover:-translate-y-0.5"
          >
            −
          </button>
          <button
            onClick={() => setZoom(z => clampZoom(Math.round((z + 0.15) * 100) / 100))}
            aria-label="Zoom in"
            className="panel font-pixel flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm text-[15px] font-bold transition-transform hover:-translate-y-0.5"
          >
            +
          </button>
          <button
            onClick={() => setBuzzOpen(o => !o)}
            className={cn(
              'panel font-pixel flex h-9 items-center rounded-sm px-3 text-[13px] font-bold transition-transform hover:-translate-y-0.5',
              buzzOpen && 'brightness-90',
            )}
          >
            noticeboard
          </button>
          <div className="panel flex h-9 items-center rounded-sm">
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
  return (
    <div
      className="panel pointer-events-none fixed z-50 max-w-96 rounded-sm px-3 py-2 [@media(hover:none)]:hidden"
      style={{
        left: Math.min(tip.x + 16, typeof window !== 'undefined' ? window.innerWidth - 300 : tip.x),
        top: tip.y + 16,
      }}
    >
      <p className="font-pixel text-[14px] font-bold">{tip.title}</p>
      {tip.body ? <p className="mt-0.5 line-clamp-14 text-xs whitespace-pre-line text-[#6b5b43]">{tip.body}</p> : null}
      {tip.when ? (
        <p className="mt-1 text-[10px] text-[#8a6d2a]">
          <RelativeTime date={tip.when} />
        </p>
      ) : null}
    </div>
  );
}
