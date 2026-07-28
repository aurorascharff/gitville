'use client';

import { catchError, type ErrorInfo } from 'next/error';
import { cottageArt, housePalette, PixelSprite, ROOF } from '@/features/village/components/shared/pixel-sprite';

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

export const VillageErrorSplash = catchError(SplashFallback);
