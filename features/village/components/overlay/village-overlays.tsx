import { Home, Star } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
import { formatStars } from '@/lib/utils';
import type { RepoData } from '@/types/github';
import type { Route } from 'next';

export async function VillageHud({ slug }: { slug: string }) {
  const repo = await getRepoData(slug);
  if (!repo) notFound();

  return (
    <>
      <VillageBusy />
      <VillageStatus repoNav={<VillageHomeLink repo={repo} />} />
      <VillageControls repoLink={<VillageRepoLink repo={repo} />} />
    </>
  );
}

export function VillagePanels() {
  return (
    <>
      <BuzzPanel />
      <PeoplePanel />
      <HouseInterior />
      <TimeMachine />
      <VillageHelp />
      <VillageMusic />
      <VillageTooltip />
    </>
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
