import { notFound } from 'next/navigation';
import { preload, SWRConfig } from 'swr';
import { getPinnedRepos } from '@/features/repo/repo-cookie';
import { cottageArt, housePalette, PixelSprite, ROOF } from '@/features/village/components/pixel-sprite';
import { VillageWorld } from '@/features/village/components/village-world';
import { getVillagePayload, getRepoData } from '@/lib/github';
import { villageKey } from '@/types/github';

export async function VillageView({ slug }: { slug: string }) {
  const [repo, pinned] = await Promise.all([getRepoData(slug), getPinnedRepos()]);
  if (!repo) notFound();

  const cacheData = preload(villageKey(repo.slug), () => getVillagePayload(repo.slug, repo.defaultBranch));

  return (
    <SWRConfig value={{ cacheData }}>
      <VillageWorld repo={repo} pinned={pinned} />
    </SWRConfig>
  );
}

export function VillageViewSkeleton() {
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
