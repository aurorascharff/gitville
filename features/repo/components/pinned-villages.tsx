import { Star } from 'lucide-react';
import Link from 'next/link';
import { getRepoData } from '@/features/repo/repo-queries';
import { getPinnedRepos } from '@/features/repo/utils/repo-cookie';
import {
  cabinArt,
  cottageArt,
  hallArt,
  housePalette,
  PixelSprite,
  ROOF,
  tentArt,
} from '@/features/village/components/shared/pixel-sprite';
import { getVillagePayload } from '@/features/village/village-queries';
import { formatStars } from '@/lib/utils';
import type { RepoData, VillagePayload } from '@/types/github';
import type { Route } from 'next';

type VillageStopData = {
  repo: RepoData;
  payload: VillagePayload | null;
};

export async function PinnedVillages() {
  const slugs = await getPinnedRepos();
  const repos = await Promise.all(slugs.map(slug => getRepoData(slug)));
  const stops = await Promise.all(
    repos.map(async repo => {
      if (!repo) return null;
      const payload = await getVillagePayload(repo.slug, repo.defaultBranch).catch(() => null);
      return { repo, payload };
    }),
  );

  if (stops.every(stop => stop === null)) return <EmptyRoad />;

  return (
    <div className="relative w-full overflow-x-auto px-2 py-4">
      <div className="relative mx-auto h-78 max-w-5xl min-w-[720px]">
        <Road />
        <ul className="relative z-10 grid h-full grid-cols-4 gap-x-8">
          {stops.map((stop, i) =>
            stop ? (
              <VillageStop key={stop.repo.slug} stop={stop} index={i} />
            ) : (
              <Unavailable key={slugs[i]} slug={slugs[i]} />
            ),
          )}
        </ul>
      </div>
    </div>
  );
}

function VillageStop({ stop, index }: { stop: VillageStopData; index: number }) {
  const { repo, payload } = stop;
  const top = index % 2 === 0;
  const prCount = payload?.prs.length ?? 0;
  const issueCount = Math.max(0, repo.openIssues - prCount);
  const [art, palette, scale] = villageSprite(repo, payload);

  return (
    <li className={top ? 'self-start' : 'self-end'}>
      <Link
        href={`/${repo.slug}` as Route}
        prefetch
        className="group flex h-36 flex-col items-center justify-end text-center transition-transform hover:-translate-y-1"
      >
        <span className="pixel relative flex min-h-20 items-end justify-center">
          <PixelSprite art={art} palette={palette} scale={scale} />
        </span>
        <span className="mt-1.5 max-w-44 rounded-sm border-2 border-[#2e2418] bg-[#f0e6d2] px-2 py-1 shadow-[2px_2px_0_rgb(0_0_0/0.3)]">
          <span className="block truncate text-[14px] leading-5 font-bold text-[#3a2f22]">{repo.name}</span>
          <span className="mt-0.5 flex items-center justify-center gap-2 text-[12px] text-[#6b5b43]">
            <span className="flex items-center gap-1">
              <Star size={11} className="fill-[#c9a227] text-[#8a6d2a]" />
              {formatStars(repo.stars)}
            </span>
            {prCount > 0 ? <span>{prCount} PRs</span> : issueCount > 0 ? <span>{issueCount} issues</span> : null}
          </span>
        </span>
      </Link>
    </li>
  );
}

function villageSprite(repo: RepoData, payload: VillagePayload | null): [string[], Record<string, string>, number] {
  const people = new Set(payload?.events.filter(e => !e.actor.endsWith('[bot]')).map(e => e.actor) ?? []);
  const prCount = payload?.prs.length ?? 0;
  if (repo.stars > 1000 || people.size > 12) return [hallArt(), housePalette(...ROOF.main, true), 3.7];
  if (prCount > 4) return [cottageArt(Math.min(4, Math.max(2, prCount)), false), housePalette(...ROOF.pr, true), 3.4];
  if (repo.openIssues > prCount + 6) return [tentArt(), housePalette(...ROOF.issue, false), 3.6];
  if ((payload?.branches.length ?? 0) > 2) return [cabinArt(), housePalette(...ROOF.branch, false), 4.1];
  return [cottageArt(1, false), housePalette(...ROOF.pr, true), 3.7];
}

function Unavailable({ slug }: { slug: string }) {
  return (
    <li className="self-end">
      <div className="rounded-sm border-2 border-dashed border-[#4a3826]/60 bg-black/25 px-3 py-2 text-center text-[12px] font-semibold text-white/70">
        {slug}
      </div>
    </li>
  );
}

function EmptyRoad() {
  return (
    <div className="relative h-44 w-full">
      <Road />
      <p className="absolute top-1/2 left-1/2 z-10 -translate-1/2 rounded-sm bg-black/35 px-3 py-1 text-[14px] font-semibold text-white/90">
        watch a repo to start the road
      </p>
    </div>
  );
}

function Road() {
  return (
    <div aria-hidden className="pixel pointer-events-none absolute inset-x-0 top-1/2 z-0 h-16 -translate-y-1/2">
      <span className="absolute inset-x-0 top-5 h-8 rotate-[-1deg] border-y-4 border-[#6b4f2f] bg-[#a5814e] shadow-[0_8px_0_rgb(0_0_0/0.18)]" />
      <span className="absolute inset-x-8 top-8 flex justify-between">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className="h-2 w-6 rounded-sm bg-[#d8bb7a]/70" />
        ))}
      </span>
    </div>
  );
}

export function PinnedVillagesSkeleton() {
  return (
    <div className="relative w-full overflow-hidden px-2 py-4">
      <div className="relative mx-auto h-78 max-w-5xl min-w-[720px]">
        <Road />
        <p className="panel absolute top-1/2 left-1/2 z-20 -translate-1/2 rounded-sm px-4 py-2 text-[14px] font-bold text-[#3a2f22] shadow-[3px_3px_0_rgb(0_0_0/0.25)]">
          loading village road...
        </p>
        <ul className="relative z-10 grid h-full grid-cols-4 gap-x-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStop key={i} index={i} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function SkeletonStop({ index }: { index: number }) {
  const top = index % 2 === 0;

  return (
    <li className={top ? 'self-start' : 'self-end'}>
      <div className="flex h-36 flex-col items-center justify-end">
        <span className="h-18 w-24 rounded-sm border-2 border-dashed border-[#f0e6d2]/45 bg-black/20" />
        <span className="mt-2 h-12 w-36 rounded-sm border-2 border-[#2e2418]/45 bg-[#f0e6d2]/45 shadow-[2px_2px_0_rgb(0_0_0/0.18)]" />
      </div>
    </li>
  );
}
