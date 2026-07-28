import { Star } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { RepoAvatar } from '@/components/ui/repo-avatar';
import { RoadScrollViewport } from '@/features/repo/components/road-scroll-viewport';
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
  limited: boolean;
};

type VillageStopLoad =
  { kind: 'ready'; slug: string; index: number; stop: VillageStopData } | { kind: 'plot'; slug: string; index: number };

const PLOT_CHUNK_SIZE = 4;

export async function PinnedVillages() {
  const slugs = await getPinnedRepos();
  if (slugs.length === 0) return <EmptyRoad />;
  const chunks = chunkSlugs(slugs, PLOT_CHUNK_SIZE);

  return (
    <RoadScrollViewport>
      <div className="relative mx-auto h-78 max-w-5xl" style={{ minWidth: chunks.length * 720 }}>
        <Road />
        <ul
          className="relative z-10 grid h-full gap-x-8"
          style={{ gridTemplateColumns: `repeat(${slugs.length}, 1fr)` }}
        >
          {chunks.map((chunk, chunkIndex) => (
            <Suspense
              key={chunk.join(':')}
              fallback={<ChunkSkeleton count={chunk.length} startIndex={chunkIndex * PLOT_CHUNK_SIZE} />}
            >
              <PinnedVillageChunk slugs={chunk} startIndex={chunkIndex * PLOT_CHUNK_SIZE} />
            </Suspense>
          ))}
        </ul>
      </div>
    </RoadScrollViewport>
  );
}

function chunkSlugs(slugs: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < slugs.length; i += size) chunks.push(slugs.slice(i, i + size));
  return chunks;
}

async function PinnedVillageChunk({ slugs, startIndex }: { slugs: string[]; startIndex: number }) {
  const stops = await Promise.all(slugs.map((slug, i) => loadVillageStop(slug, startIndex + i)));
  return stops.map(stop =>
    stop.kind === 'ready' ? (
      <VillageStop key={stop.slug} stop={stop.stop} index={stop.index} />
    ) : (
      <Unavailable key={stop.slug} slug={stop.slug} index={stop.index} />
    ),
  );
}

async function loadVillageStop(slug: string, index: number): Promise<VillageStopLoad> {
  const repo = await getRepoData(slug);
  if (!repo) return { kind: 'plot', slug, index };

  const payload = await getVillagePayload(repo.slug, repo.defaultBranch).catch(() => null);
  const livePayload = payload?.ok ? payload : null;
  return { kind: 'ready', slug, index, stop: { repo, payload: livePayload, limited: !livePayload } };
}

function VillageStop({ stop, index }: { stop: VillageStopData; index: number }) {
  const { repo, payload, limited } = stop;
  const top = index % 2 === 0;
  const prCount = payload?.prs.length ?? 0;
  const issueCount = Math.max(0, repo.openIssues - prCount);
  const [art, palette, scale] = villageSprite(repo, payload);

  return (
    <li className={stopLaneClass(top)}>
      <Link
        href={`/${repo.slug}` as Route}
        className="group flex h-36 flex-col items-center justify-end text-center transition-transform hover:-translate-y-1"
      >
        <span className="pixel relative flex min-h-20 items-end justify-center">
          <RepoAvatar
            src={repo.ownerAvatar}
            name={repo.owner}
            size={24}
            className="absolute -top-3 -left-3 z-10 rounded-sm border-2 border-[#2e2418] bg-[#f0e6d2] shadow-[2px_2px_0_rgb(0_0_0/0.25)]"
          />
          <PixelSprite art={art} palette={palette} scale={scale} />
          {limited ? <SyncRestingMarker /> : null}
        </span>
        <span className="mt-1.5 max-w-44 rounded-sm border-2 border-[#2e2418] bg-[#f0e6d2] px-2 py-1 shadow-[2px_2px_0_rgb(0_0_0/0.3)]">
          <span className="block truncate text-[14px] leading-5 font-bold text-[#3a2f22]">{repo.name}</span>
          <span className="mt-0.5 flex items-center justify-center gap-2 text-[12px] text-[#6b5b43]">
            <span className="flex items-center gap-1">
              <Star size={11} className="fill-[#c9a227] text-[#8a6d2a]" />
              {formatStars(repo.stars)}
            </span>
            {limited ? (
              <span>sync resting</span>
            ) : prCount > 0 ? (
              <span>{prCount} PRs</span>
            ) : issueCount > 0 ? (
              <span>{issueCount} issues</span>
            ) : null}
          </span>
        </span>
      </Link>
    </li>
  );
}

function SyncRestingMarker() {
  return (
    <span
      aria-hidden
      className="absolute top-3 -right-2 flex h-6 w-6 items-center justify-center rounded-sm border-2 border-[#2e2418] bg-[#e4c05a] text-[13px] font-black text-[#3a2f22] shadow-[2px_2px_0_rgb(0_0_0/0.3)]"
    >
      !
    </span>
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

function Unavailable({ slug, index }: { slug: string; index: number }) {
  const top = index % 2 === 0;
  return (
    <li className={stopLaneClass(top)}>
      <div className="flex h-36 flex-col items-center justify-end text-center">
        <span className="pixel relative flex min-h-20 items-end justify-center">
          <span className="h-14 w-24 rounded-sm border-2 border-dashed border-[#f0e6d2]/60 bg-black/25" />
          <SyncRestingMarker />
        </span>
        <span className="mt-1.5 max-w-44 rounded-sm border-2 border-dashed border-[#4a3826]/60 bg-[#f0e6d2]/75 px-2 py-1 text-[12px] font-semibold text-[#6b5b43] shadow-[2px_2px_0_rgb(0_0_0/0.18)]">
          <span className="block truncate font-bold text-[#3a2f22]">{slug}</span>
          <span>plot saved</span>
        </span>
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
      <span className="absolute inset-x-10 top-5 h-9 rounded-sm border-4 border-[#6b4f2f] bg-[#a5814e] shadow-[0_8px_0_rgb(0_0_0/0.18)]" />
      <span className="absolute inset-x-28 top-9 flex justify-between">
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

function ChunkSkeleton({ count, startIndex }: { count: number; startIndex: number }) {
  return Array.from({ length: count }).map((_, i) => <SkeletonStop key={i} index={startIndex + i} />);
}

function SkeletonStop({ index }: { index: number }) {
  const top = index % 2 === 0;

  return (
    <li className={stopLaneClass(top)}>
      <div className="flex h-36 flex-col items-center justify-end">
        <span className="h-18 w-24 rounded-sm border-2 border-dashed border-[#f0e6d2]/45 bg-black/20" />
        <span className="mt-2 h-12 w-36 rounded-sm border-2 border-[#2e2418]/45 bg-[#f0e6d2]/45 shadow-[2px_2px_0_rgb(0_0_0/0.18)]" />
      </div>
    </li>
  );
}

function stopLaneClass(top: boolean) {
  return top
    ? 'relative z-10 self-start -translate-y-3 hover:z-30 focus-within:z-30'
    : 'relative z-10 self-end -translate-y-6 hover:z-30 focus-within:z-30';
}
