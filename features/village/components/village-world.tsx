'use client';

import { BuzzPanel } from '@/features/village/components/buzz-panel';
import { HouseInterior } from '@/features/village/components/house-interior';
import { cottageArt, housePalette, PixelSprite, ROOF } from '@/features/village/components/pixel-sprite';
import { TimeMachine } from '@/features/village/components/time-machine';
import { VillageBusy } from '@/features/village/components/village-busy';
import { VillageHelp } from '@/features/village/components/village-help';
import { VillageControls, VillageStatus, VillageTooltip } from '@/features/village/components/village-hud';
import { VillageMusic } from '@/features/village/components/village-music';
import { VillageStage } from '@/features/village/components/village-stage';
import { VillageUiProvider } from '@/features/village/village-ui-context';
import type { RepoData } from '@/types/github';

export function VillageWorld({ repo, pinned }: { repo: RepoData; pinned: string[] }) {
  return (
    <VillageUiProvider repo={repo} pinned={pinned}>
      <div className="relative h-dvh w-full overflow-hidden bg-[#24462c] dark:bg-[#0e1f14]">
        <div aria-hidden className="village-vignette absolute inset-0" />
        {/* No per-section boundaries: any failure bubbles to the themed splash
            (VillageErrorSplash) at the page level instead of a small toast. */}
        <VillageStage />
        <VillageBusy />
        <VillageStatus />
        <VillageControls />
        <BuzzPanel />
        <HouseInterior />
        <TimeMachine />
        <VillageHelp />
        <VillageMusic />
        <VillageTooltip />
      </div>
    </VillageUiProvider>
  );
}

export function VillageWorldSkeleton() {
  return (
    <div className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-[#1f3d27] dark:bg-[#0c1912]">
      <div className="pixel relative flex flex-col items-center gap-4">
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
          <PixelSprite art={cottageArt(1, false)} palette={housePalette(...ROOF.pr, true)} scale={6} />
        </div>
        <p className="font-pixel rounded-sm bg-black/40 px-3 py-1 text-[14px] text-white/95">raising the village…</p>
      </div>
    </div>
  );
}
