'use client';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { cottageArt, housePalette, PixelSprite, ROOF } from '@/features/village/components/shared/pixel-sprite';
import type { ErrorInfo } from 'next/error';

export default function RepoVillageLayout({ children }: LayoutProps<'/[owner]/[name]'>) {
  return (
    <ErrorBoundary fallbackComponent={VillageErrorFallback} title="This village couldn’t load">
      {children}
    </ErrorBoundary>
  );
}

function VillageErrorFallback({ retry, title }: ErrorInfo & { title?: string }) {
  return (
    <div className="fixed inset-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden overscroll-none bg-[#1f3d27] dark:bg-[#0c1912]">
      <div className="pixel flex flex-col items-center gap-4">
        <div style={{ filter: 'drop-shadow(4px 6px 0 rgb(0 0 0 / 0.25))' }}>
          <PixelSprite art={cottageArt(1, true)} palette={housePalette(...ROOF.pr, true)} scale={6} />
        </div>
        <p className="rounded-sm bg-black/40 px-3 py-1 text-[15px] font-semibold text-white/95">
          {title ?? 'This village could not load'}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => retry()}
            className="cursor-pointer rounded-sm border-2 border-[#4a3826] bg-[#f0e6d2] px-3 py-1 text-[14px] font-bold text-[#3a2f22] transition-transform hover:-translate-y-0.5"
          >
            try again
          </button>
          <button
            onClick={() => window.history.back()}
            className="cursor-pointer rounded-sm border-2 border-[#4a3826] bg-[#f0e6d2] px-3 py-1 text-[14px] font-bold text-[#3a2f22] transition-transform hover:-translate-y-0.5"
          >
            go back
          </button>
        </div>
      </div>
    </div>
  );
}
