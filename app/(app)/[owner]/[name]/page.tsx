import { Star } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { preload, SWRConfig } from 'swr';
import { RepoSwitcher, RepoSwitcherSkeleton } from '@/features/repo/components/repo-switcher';
import { getRepoData } from '@/features/repo/repo-queries';
import { BuzzPanel } from '@/features/village/components/overlay/buzz-panel';
import {
  VillageBusy,
  VillageControls,
  VillageStatus,
  VillageTooltip,
} from '@/features/village/components/overlay/chrome';
import { VillageHelp } from '@/features/village/components/overlay/help';
import { VillageMusic } from '@/features/village/components/overlay/music';
import { TimeMachine } from '@/features/village/components/overlay/time-machine';
import { HouseInterior } from '@/features/village/components/room/house-interior';
import { cottageArt, housePalette, PixelSprite, ROOF } from '@/features/village/components/shared/pixel-sprite';
import { NightTint, VillageSky } from '@/features/village/components/stage/ambience';
import { GrassPatches, VillageDecor } from '@/features/village/components/stage/background';
import { VillageStageSurface } from '@/features/village/components/stage/stage-surface';
import { VillageUiProvider } from '@/features/village/providers/village-ui-provider';
import { getVillagePayload } from '@/features/village/village-queries';
import { formatStars } from '@/lib/utils';
import { villageKey, type RepoData } from '@/types/github';

export const prefetch = 'allow-runtime';

export async function generateMetadata({ params }: PageProps<'/[owner]/[name]'>) {
  const { owner, name } = await params;
  return { title: `${owner}/${name}` };
}

export default function RepoVillagePage({ params }: PageProps<'/[owner]/[name]'>) {
  return (
    <Suspense fallback={<VillageSkeleton />}>
      {params.then(({ owner, name }) => (
        <Village slug={`${owner}/${name}`} />
      ))}
    </Suspense>
  );
}

async function Village({ slug }: { slug: string }) {
  const repo = await getRepoData(slug);
  if (!repo) notFound();

  const cacheData = preload(villageKey(repo.slug), () => getVillagePayload(repo.slug, repo.defaultBranch));

  return (
    <SWRConfig value={{ cacheData }}>
      <VillageUiProvider slug={repo.slug}>
        <div className="relative h-dvh w-full overflow-hidden bg-[#24462c] dark:bg-[#0e1f14]">
          <div aria-hidden className="village-vignette absolute inset-0" />
          <VillageStageSurface
            terrain={
              <>
                <GrassPatches />
                <VillageDecor />
                <NightTint />
              </>
            }
            sky={<VillageSky />}
          />
          <VillageBusy />
          <VillageStatus
            repoSwitcher={
              <Suspense fallback={<RepoSwitcherSkeleton repo={repo} />}>
                <RepoSwitcher repo={repo} />
              </Suspense>
            }
          />
          <VillageControls repoLink={<VillageRepoLink repo={repo} />} />
          <BuzzPanel />
          <HouseInterior />
          <TimeMachine />
          <VillageHelp />
          <VillageMusic />
          <VillageTooltip />
        </div>
      </VillageUiProvider>
    </SWRConfig>
  );
}

function VillageSkeleton() {
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

function VillageRepoLink({ repo }: { repo: RepoData }) {
  return (
    <a
      href={`https://github.com/${repo.slug}`}
      target="_blank"
      rel="noreferrer"
      className="panel font-pixel flex h-9 items-center gap-1.5 rounded-sm px-3 text-[13px] font-bold transition-transform hover:-translate-y-0.5"
    >
      <Star size={12} className="fill-[#e4c05a] text-[#8a6d2a]" /> {formatStars(repo.stars)}
    </a>
  );
}
