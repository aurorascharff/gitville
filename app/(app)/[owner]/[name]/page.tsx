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
      aria-label={`Exit ${repo.name} and return to the repo road`}
      title="Exit"
      className="panel flex h-9 max-w-18 items-center gap-1.5 rounded-sm px-2 text-[14px] font-bold transition-transform hover:-translate-y-0.5 sm:h-11 sm:max-w-56 sm:gap-2 sm:px-3 sm:text-[15px]"
    >
      <Home size={15} strokeWidth={3} />
      <RepoAvatar src={repo.ownerAvatar} name={repo.owner} size={18} className="rounded-full sm:size-5" />
      <span className="hidden min-w-0 truncate text-sm font-semibold sm:block">{repo.name}</span>
    </Link>
  );
}

function VillageRepoLink({ repo }: { repo: RepoData }) {
  return (
    <a
      href={`https://github.com/${repo.slug}`}
      target="_blank"
      rel="noreferrer"
      aria-label={`${formatStars(repo.stars)} stars on GitHub`}
      title={`${formatStars(repo.stars)} stars`}
      className="panel flex h-8 w-8 items-center justify-center rounded-sm text-[13px] font-bold transition-transform hover:-translate-y-0.5 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3 sm:text-[14px]"
    >
      <Star size={12} className="fill-[#e4c05a] text-[#8a6d2a]" />
      <span className="hidden sm:inline">{formatStars(repo.stars)}</span>
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

      <div className="panel absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-30 h-11 w-[min(520px,calc(100vw-1.5rem))] -translate-x-1/2 rounded-sm opacity-85 sm:bottom-6 sm:h-16 sm:w-[min(520px,calc(100vw-2rem))]" />

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
          <p className="text-[18px] leading-tight font-bold text-[#3a2f22]">raising the village…</p>
          <p className="max-w-xs text-[13px] leading-snug text-[#6b5b43] sm:text-[14px]">
            Loading the repo shape, activity, versions, and stack houses.
          </p>
        </div>
      </div>
    </div>
  );
}
