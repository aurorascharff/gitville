'use client';

import { catchError, type ErrorInfo } from 'next/error';
import { cottageArt, housePalette, PixelSprite, ROOF } from '@/features/village/components/pixel-sprite';

function ErrorFallback(props: { title?: string }, { retry }: ErrorInfo) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-50 flex justify-center">
      <div className="panel pointer-events-auto flex items-center gap-3 rounded-sm px-4 py-2.5">
        <span aria-hidden className="font-pixel text-[16px] font-bold text-[#8a4a2b]">
          !
        </span>
        <p className="font-pixel text-[13px] font-bold">{props.title ?? 'Something went wrong'}</p>
        <button
          onClick={() => retry()}
          className="font-pixel cursor-pointer rounded-sm border-2 border-[#4a3826] px-2 py-0.5 text-[12px] font-bold text-[#6b5b43] transition-colors hover:bg-[#e0d3b8] hover:text-[#3a2f22]"
        >
          try again
        </button>
        <button
          onClick={() => window.history.back()}
          className="font-pixel cursor-pointer rounded-sm border-2 border-[#4a3826] px-2 py-0.5 text-[12px] font-bold text-[#6b5b43] transition-colors hover:bg-[#e0d3b8] hover:text-[#3a2f22]"
        >
          go back
        </button>
      </div>
    </div>
  );
}

// A full-screen fallback for a whole-page failure: mirrors the loading splash
// (VillageWorldSkeleton) so a failed village reads as part of the world — but the
// cottage is under construction (the same draft look used for draft PRs) to signal
// something is broken, with retry / go-back controls.
function SplashFallback(props: { title?: string }, { retry }: ErrorInfo) {
  return (
    <div className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-[#1f3d27] dark:bg-[#0c1912]">
      <div className="pixel flex flex-col items-center gap-4">
        <div style={{ filter: 'drop-shadow(4px 6px 0 rgb(0 0 0 / 0.25))' }}>
          <PixelSprite art={cottageArt(1, true)} palette={housePalette(...ROOF.pr, true)} scale={6} />
        </div>
        <p className="font-pixel rounded-sm bg-black/40 px-3 py-1 text-[14px] text-white/95">
          {props.title ?? 'This village couldn’t load'}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => retry()}
            className="font-pixel cursor-pointer rounded-sm border-2 border-[#4a3826] bg-[#f0e6d2] px-3 py-1 text-[13px] font-bold text-[#3a2f22] transition-transform hover:-translate-y-0.5"
          >
            try again
          </button>
          <button
            onClick={() => window.history.back()}
            className="font-pixel cursor-pointer rounded-sm border-2 border-[#4a3826] bg-[#f0e6d2] px-3 py-1 text-[13px] font-bold text-[#3a2f22] transition-transform hover:-translate-y-0.5"
          >
            go back
          </button>
        </div>
      </div>
    </div>
  );
}

// Handles notFound()/redirect() throws and re-fetches on retry.
export default catchError(ErrorFallback);

// Full-screen themed splash for the top-level page boundary.
export const VillageErrorSplash = catchError(SplashFallback);
