'use client';

import { Minus, Plus, Star } from 'lucide-react';
import { useHive } from '@/features/hive/hive-context';
import { RepoSwitcher } from '@/features/repo/components/repo-switcher';
import { RelativeTime } from '@/components/ui/relative-time';
import { cn } from '@/lib/utils';

// Top-left: identity pill + the live line.
export function HiveStatus() {
  const { repo, pinned, actors, live, asOf, stale, payload } = useHive();
  return (
    <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
      <RepoSwitcher repo={repo} pinned={pinned} />
      <p className="flex h-5 items-center gap-2 px-1 text-[11px] text-muted-foreground">
        <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
          <span className={cn('radar-sweep absolute inset-0 rounded-full', !live && 'opacity-25')} />
          <span className="relative h-1.5 w-1.5 rounded-full bg-brand" />
        </span>
        {stale ? (
          'rate limited — showing last sync'
        ) : live ? (
          <>
            {actors.length} buzzing · synced <RelativeTime date={payload.fetchedAt} />
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

// Top-right: stars, zoom, buzz toggle.
export function HiveControls() {
  const { repo, zoom, setZoom, buzzOpen, setBuzzOpen, focusId } = useHive();
  return (
    <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5">
      <a
        href={`https://github.com/${repo.slug}`}
        target="_blank"
        rel="noreferrer"
        className="flex h-8 items-center gap-1.5 rounded-full border bg-background/70 px-3 text-xs text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
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
              'flex h-8 items-center rounded-full border px-3 text-xs backdrop-blur transition-colors',
              buzzOpen ? 'bg-accent text-foreground' : 'bg-background/70 text-muted-foreground hover:text-foreground',
            )}
          >
            the buzz
          </button>
        </>
      ) : null}
    </div>
  );
}

// The hover inspector line — follows the cursor, fixed to the viewport.
export function HiveTooltip() {
  const { tip } = useHive();
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none fixed z-50 max-w-72 rounded-xl border bg-popover/90 px-3 py-2 shadow-2xl backdrop-blur"
      style={{ left: Math.min(tip.x + 16, typeof window !== 'undefined' ? window.innerWidth - 300 : tip.x), top: tip.y + 16 }}
    >
      <p className="font-mono text-xs font-semibold">{tip.title}</p>
      {tip.body ? <p className="mt-0.5 line-clamp-3 text-xs text-muted-foreground">{tip.body}</p> : null}
      {tip.when ? (
        <p className="mt-1 text-[10px] text-muted-foreground/70">
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
      className="flex h-8 w-8 items-center justify-center rounded-full border bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
    >
      {children}
    </button>
  );
}

function formatStars(n: number): string {
  return n >= 1000 ? `${Math.round(n / 100) / 10}k` : `${n}`;
}
