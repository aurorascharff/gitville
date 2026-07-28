import { Home, Star } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { preload, SWRConfig } from 'swr';
import { RepoAvatar } from '@/components/ui/repo-avatar';
import { getRepoData } from '@/features/repo/repo-queries';
import { BuzzPanel, PeoplePanel } from '@/features/village/components/overlay/buzz-panel';
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
import { WORLD_H, WORLD_W } from '@/features/village/utils/village-model';
import { getVillagePayload } from '@/features/village/village-queries';
import { formatStars } from '@/lib/utils';
import { villageKey, type RepoData } from '@/types/github';
import type { Route } from 'next';

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
            repo={repo}
            terrain={
              <>
                <GrassPatches />
                <NightTint />
              </>
            }
            sky={<VillageSky />}
          />
          <VillageBusy />
          <VillageStatus repoNav={<VillageHomeLink repo={repo} />} />
          <VillageControls repoLink={<VillageRepoLink repo={repo} />} />
          <BuzzPanel />
          <PeoplePanel />
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

function VillageHomeLink({ repo }: { repo: RepoData }) {
  return (
    <Link
      href={'/' as Route}
      prefetch
      aria-label={`Exit ${repo.name} and return to the repo road`}
      title="Exit"
      className="panel flex h-11 max-w-56 items-center gap-2 rounded-sm px-3 text-[15px] font-bold transition-transform hover:-translate-y-0.5"
    >
      <Home size={15} strokeWidth={3} />
      <RepoAvatar src={repo.ownerAvatar} name={repo.owner} size={20} className="rounded-full" />
      <span className="min-w-0 truncate text-sm font-semibold">{repo.name}</span>
    </Link>
  );
}

function VillageRepoLink({ repo }: { repo: RepoData }) {
  return (
    <a
      href={`https://github.com/${repo.slug}`}
      target="_blank"
      rel="noreferrer"
      className="panel flex h-9 items-center gap-1.5 rounded-sm px-3 text-[14px] font-bold transition-transform hover:-translate-y-0.5"
    >
      <Star size={12} className="fill-[#e4c05a] text-[#8a6d2a]" /> {formatStars(repo.stars)}
    </a>
  );
}

function VillageSkeleton() {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#24462c] dark:bg-[#0e1f14]">
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

      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
        <div className="panel h-9 w-58 rounded-sm px-3 py-2">
          <div className="h-3 w-42 rounded-xs bg-[#6b5b43]/25" />
        </div>
        <p className="flex h-6 items-center gap-2 px-1 text-[14px] font-semibold text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.7)]">
          <span className="h-2 w-2 rounded-full bg-[#e4c05a]" />
          syncing village
        </p>
      </div>

      <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5">
        <div className="panel h-9 w-20 rounded-sm" />
        <div className="panel h-9 w-9 rounded-sm" />
        <div className="panel h-9 w-9 rounded-sm" />
        <div className="panel h-9 w-28 rounded-sm" />
        <div className="panel h-9 w-24 rounded-sm" />
      </div>

      <div className="panel absolute bottom-6 left-1/2 z-30 h-16 w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 rounded-sm opacity-85" />

      <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-4">
        <div className="panel pixel pointer-events-auto relative flex max-w-sm flex-col items-center gap-4 rounded-sm p-6 text-center shadow-[8px_10px_0_rgb(0_0_0/0.35)]">
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
          <p className="text-[18px] leading-tight font-bold text-[#3a2f22]">raising the village…</p>
          <p className="max-w-xs text-[14px] leading-snug text-[#6b5b43]">
            Loading the repo shape, activity, versions, and stack houses.
          </p>
        </div>
      </div>
    </div>
  );
}
