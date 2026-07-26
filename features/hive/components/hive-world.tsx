'use client';

import { HiveProvider } from '@/features/hive/hive-context';
import { BuzzPanel } from '@/features/hive/components/buzz-panel';
import { HiveControls, HiveStatus, HiveTooltip } from '@/features/hive/components/hive-hud';
import { RoomView } from '@/features/hive/components/room-view';
import { HiveStage } from '@/features/hive/components/hive-stage';
import { TimeMachine } from '@/features/hive/components/time-machine';
import type { RepoData } from '@/types/github';

// Composition root: the stage is the app; every other surface floats over it.
export function HiveWorld({ repo, pinned }: { repo: RepoData; pinned: string[] }) {
  return (
    <HiveProvider repo={repo} pinned={pinned}>
      <div className="grass-field relative h-dvh w-full overflow-hidden">
        <Atmosphere />
        <HiveStage />
        <HiveStatus />
        <HiveControls />
        <BuzzPanel />
        <RoomView />
        <TimeMachine />
        <HiveTooltip />
      </div>
    </HiveProvider>
  );
}

// Center glow, dot field, vignette — the mood lighting under everything.
function Atmosphere() {
  return (
    <>
      {/* Night falls on the village: moonlight from the square, darkness at the edges. */}
      <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 48% at 50% 46%, rgb(255 244 200 / 0.07), transparent 70%)' }} />
      <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 95% 85% at 50% 50%, transparent 45%, rgb(6 10 8 / 0.78))' }} />
    </>
  );
}
