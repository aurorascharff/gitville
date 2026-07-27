'use client';

import { useHiveUi } from '@/features/hive/hive-ui-context';
import { SCRUB_MAX, useHiveData, useTimeWindow } from '@/features/hive/use-hive-data';

export function TimeMachine() {
  const { slug, scrub, setScrub } = useHiveUi();
  const { payload } = useHiveData(slug);
  const { minT, maxT, asOf, live } = useTimeWindow(payload, scrub);

  return (
    <div className="absolute inset-x-0 bottom-5 z-30 flex justify-center px-4">
      <div className="bg-background/80 flex w-full max-w-xl items-center gap-3 rounded-full border py-2.5 pr-2 pl-5 shadow-2xl backdrop-blur-md">
        <span className="text-muted-foreground/80 hidden shrink-0 font-mono text-[10px] sm:inline">
          -{spanLabel(maxT - minT)}
        </span>
        <input
          type="range"
          min={0}
          max={SCRUB_MAX}
          value={scrub}
          onChange={e => setScrub(Number(e.target.value))}
          aria-label="Scrub back in time"
          className="accent-brand h-1 flex-1 cursor-pointer"
        />
        {live ? (
          <span className="bg-brand/15 text-brand flex w-28 items-center justify-center gap-1.5 rounded-full py-1 text-[11px] font-semibold">
            <span className="bg-brand h-1.5 w-1.5 animate-pulse rounded-full" /> LIVE
          </span>
        ) : (
          <button
            onClick={() => setScrub(SCRUB_MAX)}
            className="text-muted-foreground hover:text-foreground w-28 rounded-full border py-1 text-center font-mono text-[11px] font-medium transition-colors"
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
  return hours < 48 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}

function clockLabel(t: number): string {
  return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
