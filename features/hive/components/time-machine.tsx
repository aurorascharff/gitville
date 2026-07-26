'use client';

import { useHive, SCRUB_MAX } from '@/features/hive/hive-context';

// Drag back through the visible event window and watch everyone walk to where
// they were. The window is whatever GitHub's event feed covers (up to 300 events).
export function TimeMachine() {
  const { scrub, setScrub, live, asOf, minT } = useHive();
  const windowLabel = spanLabel(Date.now() - minT);

  return (
    <div className="absolute inset-x-0 bottom-5 z-30 flex justify-center px-4">
      <div className="flex w-full max-w-xl items-center gap-3 rounded-full border bg-background/75 py-2.5 pr-2 pl-5 shadow-2xl backdrop-blur-md">
        <span className="hidden shrink-0 font-mono text-[10px] text-muted-foreground/70 sm:inline">-{windowLabel}</span>
        <input
          type="range"
          min={0}
          max={SCRUB_MAX}
          value={scrub}
          onChange={e => setScrub(Number(e.target.value))}
          aria-label="Scrub back in time"
          className="h-1 flex-1 cursor-pointer accent-brand"
        />
        {live ? (
          <span className="flex w-28 items-center justify-center gap-1.5 rounded-full bg-brand/15 py-1 text-[11px] font-semibold text-brand">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" /> LIVE
          </span>
        ) : (
          <button
            onClick={() => setScrub(SCRUB_MAX)}
            className="w-28 rounded-full border py-1 text-center font-mono text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {clockLabel(asOf)}
          </button>
        )}
      </div>
    </div>
  );
}

function spanLabel(ms: number): string {
  const hours = Math.round(ms / 3_600_000);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function clockLabel(t: number): string {
  const d = new Date(t);
  return `⏪ ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
