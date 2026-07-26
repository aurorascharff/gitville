'use client';

import { BuzzPanel } from '@/features/hive/components/buzz-panel';
import { HiveControls, HiveStatus, HiveTooltip } from '@/features/hive/components/hive-hud';
import { HiveStage } from '@/features/hive/components/hive-stage';
import { RoomView } from '@/features/hive/components/room-view';
import { TimeMachine } from '@/features/hive/components/time-machine';
import { HiveUiProvider } from '@/features/hive/hive-ui-context';
import type { RepoData } from '@/types/github';

// The stage is the app; every other surface floats over it.
export function HiveWorld({ repo, pinned }: { repo: RepoData; pinned: string[] }) {
  return (
    <HiveUiProvider repo={repo} pinned={pinned}>
      <div className="grass-field relative h-dvh w-full overflow-hidden">
        <div aria-hidden className="village-sun absolute inset-0" />
        <div aria-hidden className="village-vignette absolute inset-0" />
        <HiveStage />
        <HiveStatus />
        <HiveControls />
        <BuzzPanel />
        <RoomView />
        <TimeMachine />
        <HiveTooltip />
      </div>
    </HiveUiProvider>
  );
}
