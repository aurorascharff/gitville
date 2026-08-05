import { cottageArt, housePalette, PixelSprite, ROOF } from '@/features/village/components/shared/pixel-sprite';
import { NightTint, VillageSky } from '@/features/village/components/stage/ambience';
import { GrassPatches, VillageDecor } from '@/features/village/components/stage/background';
import { WORLD_H, WORLD_W } from '@/features/village/utils/village-model';
import type { ReactNode } from 'react';

export function VillageViewport({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden overscroll-none bg-[#24462c] dark:bg-[#0e1f14]">
      <div aria-hidden className="village-vignette absolute inset-0" />
      {children}
    </div>
  );
}

export function VillageViewportSkeleton() {
  return (
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden overscroll-none bg-[#24462c] dark:bg-[#0e1f14]">
      <div aria-hidden className="village-vignette absolute inset-0" />
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="grass-field absolute top-0 left-0"
          style={{
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: '0 0',
            transform: `translate(calc(50vw - ${WORLD_W / 2}px), calc(50dvh - ${WORLD_H / 2 + 170}px))`,
            boxShadow: 'inset 0 0 140px 80px rgb(14 30 18 / 0.6)',
          }}
        >
          <GrassPatches />
          <VillageDecor />
          <NightTint />
          <div className="absolute top-[1450px] left-[1530px] h-4 w-72 rotate-[-8deg] rounded-sm bg-[#a5814e]/65 shadow-[0_0_0_6px_rgb(79_55_28/0.18)]" />
          <div className="absolute top-[1540px] left-[1740px] h-4 w-64 rotate-[22deg] rounded-sm bg-[#a5814e]/55 shadow-[0_0_0_6px_rgb(79_55_28/0.15)]" />
        </div>
        <VillageSky />
      </div>

      <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 z-30 flex max-w-[calc(100vw-6.5rem)] flex-col gap-1.5 sm:top-4 sm:left-4 sm:max-w-none sm:gap-2">
        <div className="panel h-9 w-18 rounded-sm px-2 py-2 sm:w-58 sm:px-3">
          <div className="h-3 w-10 rounded-xs bg-[#6b5b43]/25 sm:w-42" />
        </div>
        <p className="flex h-5 items-center gap-1.5 px-1 text-[12px] font-semibold text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.7)] sm:h-6 sm:gap-2 sm:text-[14px]">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#e4c05a]" />
          syncing village
        </p>
      </div>

      <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-30 flex items-center gap-1 sm:top-4 sm:right-4 sm:gap-1.5">
        <div className="panel h-8 w-8 rounded-sm sm:h-9 sm:w-20" />
        <div className="panel h-8 w-8 rounded-sm sm:h-9 sm:w-9" />
        <div className="panel hidden h-9 w-9 rounded-sm sm:block" />
        <div className="panel h-8 w-8 rounded-sm sm:h-9 sm:w-28" />
        <div className="panel h-8 w-8 rounded-sm sm:h-9 sm:w-24" />
      </div>

      <div className="panel absolute right-14 bottom-[max(3.75rem,env(safe-area-inset-bottom)+3.75rem)] z-30 h-8 w-8 rounded-sm opacity-85 sm:bottom-5 sm:h-9 sm:w-9" />

      <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-4">
        <div className="panel pixel pointer-events-auto relative flex max-w-[min(22rem,calc(100vw-2rem))] flex-col items-center gap-3 rounded-sm p-4 text-center shadow-[8px_10px_0_rgb(0_0_0/0.35)] sm:gap-4 sm:p-6">
          <div className="relative" style={{ filter: 'drop-shadow(4px 6px 0 rgb(0 0 0 / 0.25))' }}>
            <span aria-hidden className="pointer-events-none absolute -top-1 right-[21%]">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="smoke-puff absolute h-2 w-2 rounded-full bg-white/70"
                  style={{ animationDelay: `${i * 900}ms` }}
                />
              ))}
            </span>
            <PixelSprite art={cottageArt(1, false)} palette={housePalette(...ROOF.pr, true)} scale={5} />
          </div>
          <p className="text-[18px] leading-tight font-bold text-[#3a2f22]">raising the village...</p>
          <p className="max-w-xs text-[13px] leading-snug text-[#6b5b43] sm:text-[14px]">
            Loading the repo shape, activity, versions, and stack houses.
          </p>
        </div>
      </div>
    </div>
  );
}
