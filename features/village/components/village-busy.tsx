'use client';

import { useSWRConfig } from 'swr';
import { cottageArt, housePalette, PixelSprite, ROOF } from '@/features/village/components/pixel-sprite';
import { useVillageData } from '@/features/village/use-village-data';
import { useVillageUi } from '@/features/village/village-ui-context';
import { villageKey } from '@/types/github';

// Covers the stage when there's no usable data (GitHub busy / rate limited),
// sitting below the HUD so the repo picker and controls stay reachable.
export function VillageBusy() {
  const { slug } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { mutate } = useSWRConfig();
  if (payload.ok) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-[#24462c] dark:bg-[#0e1f14]">
      <div aria-hidden className="village-vignette absolute inset-0" />
      <div className="pixel relative flex flex-col items-center gap-4 px-6 text-center">
        <PixelSprite art={cottageArt(1, false)} palette={housePalette(...ROOF.pr, true)} scale={5} />
        <p className="font-pixel text-[18px] text-white drop-shadow-[0_2px_2px_rgb(0_0_0/0.6)]">
          the village is resting
        </p>
        <p className="max-w-xs font-mono text-[13px] text-white/70">
          GitHub is rate limiting us right now. Switch villages from the picker, or come back in a minute.
        </p>
        <button
          onClick={() => mutate(villageKey(slug))}
          className="panel font-pixel mt-1 cursor-pointer rounded-sm px-3 py-1.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5"
        >
          try again
        </button>
      </div>
    </div>
  );
}
