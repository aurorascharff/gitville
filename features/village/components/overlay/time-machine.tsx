'use client';

import { useVillageData } from '@/features/village/hooks/use-village-data';
import { useVillageUi } from '@/features/village/providers/village-ui-provider';
import { SCRUB_MAX, timeWindowFor } from '@/features/village/utils/village-model';

export function TimeMachine() {
  const { slug, scrub, setScrub } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { minT, maxT, asOf, live } = timeWindowFor(payload, scrub);
  if (!payload.ok) return null;

  return (
    <div className="absolute inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex justify-center px-3 sm:bottom-5 sm:px-4">
      <div className="panel flex w-full max-w-xl items-center gap-2 rounded-sm py-1.5 pr-1.5 pl-2.5 sm:gap-3 sm:py-2 sm:pr-2 sm:pl-3">
        <ClockFace t={asOf} />
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
          className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[#8a4a2b]"
        />
        <span className="hidden shrink-0 font-mono text-[12px] text-[#8a6d2a] sm:inline">now</span>
        {live ? (
          <span className="flex h-8 w-14 shrink-0 items-center justify-center gap-1 rounded-sm border-2 border-[#4a3826] bg-[#e0d3b8] text-[11px] font-bold text-[#3a2f22] sm:w-28 sm:gap-1.5 sm:py-1 sm:text-[13px]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#58a55c]" /> LIVE
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setScrub(SCRUB_MAX)}
            className="h-8 w-16 shrink-0 cursor-pointer truncate rounded-sm border-2 border-[#4a3826] px-1 text-center text-[11px] font-bold text-[#6b5b43] transition-colors hover:bg-[#e0d3b8] hover:text-[#3a2f22] sm:w-32 sm:text-[13px]"
          >
            {clockLabel(asOf)} ↺
          </button>
        )}
      </div>
    </div>
  );
}

function ClockFace({ t }: { t: number }) {
  const d = new Date(t);
  const hourDeg = ((d.getHours() % 12) + d.getMinutes() / 60) * 30;
  const minDeg = d.getMinutes() * 6;
  return (
    <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden className="pixel shrink-0 sm:h-10 sm:w-10">
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
