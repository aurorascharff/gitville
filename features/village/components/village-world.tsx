'use client';

import ErrorBoundary from '@/components/ui/error-boundary';
import { BuzzPanel } from '@/features/village/components/buzz-panel';
import { HouseInterior } from '@/features/village/components/house-interior';
import { TimeMachine } from '@/features/village/components/time-machine';
import { VillageHelp } from '@/features/village/components/village-help';
import { VillageControls, VillageStatus, VillageTooltip } from '@/features/village/components/village-hud';
import { VillageStage } from '@/features/village/components/village-stage';
import { VillageUiProvider } from '@/features/village/village-ui-context';
import type { RepoData } from '@/types/github';

// The stage is the app; every other surface floats over it. Each surface has its
// own boundary so one broken panel never takes the village down with it.
export function VillageWorld({ repo, pinned }: { repo: RepoData; pinned: string[] }) {
  return (
    <VillageUiProvider repo={repo} pinned={pinned}>
      <div className="relative h-dvh w-full overflow-hidden bg-[#1f3d27] dark:bg-[#0c1912]">
        <div aria-hidden className="village-vignette absolute inset-0" />
        <ErrorBoundary title="The village couldn’t be drawn">
          <VillageStage />
        </ErrorBoundary>
        <ErrorBoundary title="Status sign broke">
          <VillageStatus />
        </ErrorBoundary>
        <ErrorBoundary title="Controls broke">
          <VillageControls />
        </ErrorBoundary>
        <ErrorBoundary title="The noticeboard fell over">
          <BuzzPanel />
        </ErrorBoundary>
        <ErrorBoundary title="This house couldn’t be entered">
          <HouseInterior />
        </ErrorBoundary>
        <ErrorBoundary title="The time machine jammed">
          <TimeMachine />
        </ErrorBoundary>
        <ErrorBoundary title="The field guide is missing">
          <VillageHelp />
        </ErrorBoundary>
        <VillageTooltip />
      </div>
    </VillageUiProvider>
  );
}
