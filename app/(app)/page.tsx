import { Star } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { GitvilleMark } from '@/components/gitville-mark';
import { RepoAvatar } from '@/components/ui/repo-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { WatchForm } from '@/features/repo/components/watch-form';
import { getPinnedRepos } from '@/features/repo/repo-cookie';
import { BUSH, cottageArt, FLOWER, hallArt, housePalette, PixelSprite, TREE } from '@/features/village/components/pixel-sprite';
import { getRepoData } from '@/lib/github';
import type { Route } from 'next';

export const prefetch = 'allow-runtime';

// The world picker: choose which village to visit.
export default function HomePage() {
  return (
    <div
      className="grass-field relative min-h-dvh overflow-hidden"
      style={{ backgroundSize: '48px 48px, 68px 68px, 16px 16px' }}
    >
      <div aria-hidden className="village-vignette absolute inset-0" />
      <HomeScenery />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-14">
        <header className="pixel flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2.5 rounded-md border-4 border-[#4a3826] bg-[#f0e6d2] px-5 py-2.5 shadow-xl">
            <GitvilleMark size={30} />
            <h1 className="font-pixel text-2xl font-bold tracking-tight text-[#3a2f22]">Gitville</h1>
          </div>
          <p className="font-pixel max-w-md rounded-sm bg-black/40 px-3 py-1 text-[14px] text-white/95">
            your repo as a tiny village. real people, real commits, live.
          </p>
        </header>

        <Suspense fallback={<VillagesSkeleton />}>
          <Villages />
        </Suspense>

        <WatchForm />

        <a
          href="https://github.com/aurorascharff/gitville"
          target="_blank"
          rel="noreferrer"
          className="font-pixel rounded-sm bg-black/40 px-2 py-0.5 text-[11px] text-white/80 transition-colors hover:text-white"
        >
          gitville is a repo too — view the source
        </a>
      </div>
    </div>
  );
}

// The home page is a village too: a tree line, a couple of houses, some growth.
function HomeScenery() {
  const cottage = housePalette('#c85b5b', '#9d4444', true);
  const hall = housePalette('#3b6bff', '#2b4fc4', true);
  return (
    <div aria-hidden className="pixel pointer-events-none absolute inset-0">
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} className="absolute" style={{ left: `${i * 7.5 + ((i * 37) % 4)}%`, bottom: -14 - ((i * 23) % 18) }}>
          <PixelSprite art={TREE.art} palette={TREE.palette} scale={i % 3 === 0 ? 6 : 5} />
        </span>
      ))}
      <span className="absolute bottom-24 left-[8%] hidden md:block">
        <PixelSprite art={cottageArt(1, false)} palette={cottage} scale={4} />
      </span>
      <span className="absolute right-[7%] bottom-28 hidden md:block">
        <PixelSprite art={hallArt()} palette={hall} scale={4} />
      </span>
      <span className="absolute top-[18%] left-[14%]">
        <PixelSprite art={BUSH.art} palette={BUSH.palette} scale={4} />
      </span>
      <span className="absolute top-[24%] right-[16%]">
        <PixelSprite art={FLOWER.art} palette={FLOWER.palette} scale={4} />
      </span>
      <span className="absolute top-[64%] left-[6%]">
        <PixelSprite art={FLOWER.art} palette={FLOWER.palette} scale={3} />
      </span>
    </div>
  );
}

async function Villages() {
  const slugs = await getPinnedRepos();
  const repos = await Promise.all(slugs.map(slug => getRepoData(slug)));

  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
      {repos.map((repo, i) =>
        repo ? (
          <Link
            key={repo.slug}
            href={`/${repo.slug}` as Route}
            prefetch
            className="pixel group flex min-h-40 flex-col items-center gap-2 rounded-md border-4 border-[#4a3826] bg-[#f0e6d2] px-3 py-4 text-center shadow-xl transition-transform hover:-translate-y-1"
          >
            <RepoAvatar
              src={repo.ownerAvatar}
              name={repo.owner}
              size={40}
              className="rounded-md border-2 border-black/20"
            />
            <span className="w-full truncate font-mono text-sm font-bold text-[#3a2f22]">{repo.name}</span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-[#6b5b43]">
              <Star size={10} className="fill-[#c9a227] text-[#8a6d2a]" />
              {repo.stars >= 1000 ? `${Math.round(repo.stars / 100) / 10}k` : repo.stars}
            </span>
            <span className="rounded-sm bg-[#5a8f52] px-2 py-0.5 font-mono text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
              enter →
            </span>
          </Link>
        ) : (
          <div
            key={slugs[i]}
            className="pixel rounded-md border-4 border-dashed border-[#4a3826]/50 px-3 py-4 text-center font-mono text-[10px] text-white/70"
          >
            {slugs[i]} unavailable
          </div>
        ),
      )}
    </div>
  );
}

function VillagesSkeleton() {
  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="pixel flex min-h-40 flex-col items-center gap-2 rounded-md border-4 border-[#4a3826]/70 bg-[#f0e6d2]/80 px-3 py-4"
        >
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3.75 w-10" />
          <Skeleton className="h-5.25 w-14 rounded-sm" />
        </div>
      ))}
    </div>
  );
}
