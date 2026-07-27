import { notFound } from 'next/navigation';
import { preload, SWRConfig } from 'swr';
import { getPinnedRepos } from '@/features/repo/repo-cookie';
import { cottageArt, housePalette, PixelSprite } from '@/features/village/components/pixel-sprite';
import { VillageWorld } from '@/features/village/components/village-world';
import { getVillagePayload, getRepoData } from '@/lib/github';
import { villageKey } from '@/types/github';

export async function VillageView({ slug }: { slug: string }) {
  const [repo, pinned] = await Promise.all([getRepoData(slug), getPinnedRepos()]);
  if (!repo) notFound();

  // Server-seeded SWR: the world hydrates from this snapshot with no refetch,
  // then every component's useSWR polls the same key (preload + cacheData).
  const cacheData = preload(villageKey(repo.slug), () => getVillagePayload(repo.slug, repo.defaultBranch));

  return (
    <SWRConfig value={{ cacheData }}>
      <VillageWorld repo={repo} pinned={pinned} />
    </SWRConfig>
  );
}

// Splash screen: a cottage going up while the village loads.
export function VillageViewSkeleton() {
  return (
    <div className="grass-field relative flex h-dvh w-full items-center justify-center overflow-hidden">
      <div aria-hidden className="village-vignette absolute inset-0" />
      <div className="pixel relative flex flex-col items-center gap-4">
        <div className="relative" style={{ filter: 'drop-shadow(4px 6px 0 rgb(0 0 0 / 0.25))' }}>
          <span aria-hidden className="pointer-events-none absolute -top-1 right-[21%]">
            {[0, 1, 2].map(i => (
              <span key={i} className="smoke-puff absolute h-2 w-2 rounded-full bg-white/70" style={{ animationDelay: `${i * 900}ms` }} />
            ))}
          </span>
          <PixelSprite art={cottageArt(1, false)} palette={housePalette('#c85b5b', '#9d4444', true)} scale={6} />
        </div>
        <p className="font-pixel rounded-sm bg-black/40 px-3 py-1 text-[14px] text-white/95">raising the village…</p>
      </div>
    </div>
  );
}
