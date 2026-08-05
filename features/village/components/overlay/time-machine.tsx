'use client';

import { useEffect, useState } from 'react';
import { useVillageData } from '@/features/village/hooks/use-village-data';
import { useVillageUi } from '@/features/village/providers/village-ui-provider';
import { SCRUB_MAX, timeWindowFor } from '@/features/village/utils/village-model';
import { cn } from '@/lib/utils';

export function TimeMachine() {
  const { slug, scrub, setScrub, focusId } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { minT, maxT, asOf, live } = timeWindowFor(payload, scrub);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!payload.ok) return null;

  return (
    <div
      className={cn(
        'absolute right-3 z-50 flex flex-col items-end gap-1.5 sm:right-4',
        focusId
          ? 'bottom-[max(4.25rem,env(safe-area-inset-bottom)+4.25rem)] sm:bottom-5'
          : 'bottom-[max(3.75rem,env(safe-area-inset-bottom)+3.75rem)] sm:bottom-5',
      )}
    >
      {open ? (
        <div
          id="village-timeline"
          className="panel flex h-11 w-[min(36rem,calc(100vw-1.5rem))] items-center gap-1.5 rounded-sm py-1 pr-1.5 pl-2 sm:h-auto sm:gap-3 sm:py-2 sm:pr-2 sm:pl-3"
        >
          <span className="hidden shrink-0 font-mono text-[12px] text-[#8a6d2a] sm:inline">
            {spanLabel(maxT - minT)} ago
          </span>
          <input
            type="range"
            min={0}
            max={SCRUB_MAX}
            value={scrub}
            onChange={e => setScrub(Number(e.target.value))}
            aria-label="Wind the village clock back in time"
            className="h-1 min-w-0 flex-1 cursor-pointer accent-[#8a4a2b] sm:h-1.5"
          />
          <span className="hidden shrink-0 font-mono text-[12px] text-[#8a6d2a] sm:inline">now</span>
          {live ? (
            <span className="flex h-7 w-11 shrink-0 items-center justify-center gap-0.5 rounded-sm border-2 border-[#4a3826] bg-[#e0d3b8] text-[10px] font-bold text-[#3a2f22] sm:h-8 sm:w-28 sm:gap-1.5 sm:py-1 sm:text-[13px]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#58a55c]" /> LIVE
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setScrub(SCRUB_MAX)}
              className="h-7 w-12 shrink-0 cursor-pointer truncate rounded-sm border-2 border-[#4a3826] px-1 text-center text-[10px] font-bold text-[#6b5b43] transition-colors hover:bg-[#e0d3b8] hover:text-[#3a2f22] sm:h-8 sm:w-32 sm:text-[13px]"
            >
              {clockLabel(asOf)} ↺
            </button>
          )}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-label={open ? 'Close village clock' : 'Open village clock'}
        aria-expanded={open}
        aria-controls="village-timeline"
        title={live ? 'Village clock' : clockLabel(asOf)}
        className={cn(
          'panel flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm transition-transform hover:-translate-y-0.5 sm:h-9 sm:w-9',
          !live && 'ring-2 ring-[#e4c05a]',
        )}
      >
        <ClockFace t={asOf} />
      </button>
    </div>
  );
}

function ClockFace({ t }: { t: number }) {
  const d = new Date(t);
  const hourDeg = ((d.getHours() % 12) + d.getMinutes() / 60) * 30;
  const minDeg = d.getMinutes() * 6;
  return (
    <svg width="25" height="25" viewBox="0 0 40 40" aria-hidden className="pixel shrink-0 sm:h-7 sm:w-7">
      <circle cx="20" cy="20" r="18" fill="#f7efdc" stroke="#4a3826" strokeWidth="3" />
      {[0, 90, 180, 270].map(deg => (
        <rect key={deg} x="19" y="5" width="2" height="4" fill="#8a6d2a" transform={`rotate(${deg} 20 20)`} />
      ))}
      <line
        x1="20"
        y1="20"
        x2="20"
        y2="12"
        stroke="#3a2f22"
        strokeWidth="3"
        strokeLinecap="round"
        transform={`rotate(${hourDeg} 20 20)`}
      />
      <line
        x1="20"
        y1="20"
        x2="20"
        y2="8"
        stroke="#8a4a2b"
        strokeWidth="2"
        strokeLinecap="round"
        transform={`rotate(${minDeg} 20 20)`}
      />
      <circle cx="20" cy="20" r="1.8" fill="#4a3826" />
    </svg>
  );
}

function spanLabel(ms: number): string {
  const hours = Math.round(ms / 3_600_000);
  return hours < 48 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}

function clockLabel(t: number): string {
  return `${new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' })} ${new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
