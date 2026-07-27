'use client';

import { BuzzPanel } from '@/features/village/components/buzz-panel';
import { RoomView } from '@/features/village/components/room-view';
import { TimeMachine } from '@/features/village/components/time-machine';
import { VillageControls, VillageStatus, VillageTooltip } from '@/features/village/components/village-hud';
import { VillageStage } from '@/features/village/components/village-stage';
import { VillageUiProvider } from '@/features/village/village-ui-context';
import type { RepoData } from '@/types/github';

// The stage is the app; every other surface floats over it.
export function VillageWorld({ repo, pinned }: { repo: RepoData; pinned: string[] }) {
  return (
    <VillageUiProvider repo={repo} pinned={pinned}>
      <div className="grass-field relative h-dvh w-full overflow-hidden">
        <div aria-hidden className="village-sun absolute inset-0" />
        <div aria-hidden className="village-vignette absolute inset-0" />
        <VillageStage />
        <VillageStatus />
        <VillageControls />
        <BuzzPanel />
        <RoomView />
        <TimeMachine />
        <VillageTooltip />
      </div>
    </VillageUiProvider>
  );
}
