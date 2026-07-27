'use client';

import { Minus, Plus, Star } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { RelativeTime } from '@/components/ui/relative-time';
import { RepoSwitcher } from '@/features/repo/components/repo-switcher';
import { useVillageData, useTimeWindow, useWorldModel } from '@/features/village/use-village-data';
import { useVillageUi } from '@/features/village/village-ui-context';
import { cn } from '@/lib/utils';

export function VillageStatus() {
  const { slug, repo, pinned, scrub } = useVillageUi();
  const { payload, stale } = useVillageData(slug);
  const { asOf, live } = useTimeWindow(payload, scrub);
  const { actors } = useWorldModel(payload, slug, asOf);

  return (
    <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
      <RepoSwitcher repo={repo} pinned={pinned} />
      <p className="font-pixel flex h-6 items-center gap-2 px-1 text-[13px] text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.7)]">
        <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
          <span className={cn('radar-sweep absolute inset-0 rounded-full', !live && 'opacity-25')} />
          <span className="bg-brand relative h-1.5 w-1.5 rounded-full" />
        </span>
        {stale ? (
          'rate limited — showing last sync'
        ) : live ? (
          <>
            {actors.length} villagers about · synced <RelativeTime date={payload.fetchedAt} />
          </>
        ) : (
          <span className="font-mono">
            viewing {new Date(asOf).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
            {new Date(asOf).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        )}
      </p>
    </div>
  );
}

export function VillageControls() {
  const { repo, zoom, setZoom, buzzOpen, setBuzzOpen, focusId } = useVillageUi();
  return (
    <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5">
      <a
        href={`https://github.com/${repo.slug}`}
        target="_blank"
        rel="noreferrer"
        className="bg-background/80 text-muted-foreground hover:text-foreground flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs backdrop-blur transition-colors"
      >
        <Star size={12} className="fill-muted-foreground/30" /> {formatStars(repo.stars)}
      </a>
      {!focusId ? (
        <>
          <HudButton label="Zoom out" onClick={() => setZoom(z => Math.max(0.6, Math.round((z - 0.2) * 10) / 10))}>
            <Minus size={13} />
          </HudButton>
          <HudButton label="Zoom in" onClick={() => setZoom(z => Math.min(1.6, Math.round((z + 0.2) * 10) / 10))}>
            <Plus size={13} />
          </HudButton>
          <button
            onClick={() => setBuzzOpen(o => !o)}
            className={cn(
              'panel font-pixel flex h-9 items-center rounded-sm px-3 text-[13px] font-bold transition-transform hover:-translate-y-0.5',
              buzzOpen && 'brightness-90',
            )}
          >
            the buzz
          </button>
          <div className="bg-background/80 rounded-full border backdrop-blur">
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
      className="bg-popover/95 pointer-events-none fixed z-50 max-w-72 rounded-xl border px-3 py-2 shadow-2xl backdrop-blur"
      style={{
        left: Math.min(tip.x + 16, typeof window !== 'undefined' ? window.innerWidth - 300 : tip.x),
        top: tip.y + 16,
      }}
    >
      <p className="font-pixel text-[14px] font-bold">{tip.title}</p>
      {tip.body ? <p className="text-muted-foreground mt-0.5 line-clamp-3 text-xs">{tip.body}</p> : null}
      {tip.when ? (
        <p className="text-muted-foreground/70 mt-1 text-[10px]">
          <RelativeTime date={tip.when} /> ago
        </p>
      ) : null}
    </div>
  );
}

function HudButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="bg-background/80 text-muted-foreground hover:text-foreground flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur transition-colors"
    >
      {children}
    </button>
  );
}

function formatStars(n: number): string {
  return n >= 1000 ? `${Math.round(n / 100) / 10}k` : `${n}`;
}
