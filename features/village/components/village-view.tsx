import { notFound } from 'next/navigation';
import { preload, SWRConfig } from 'swr';
import { getPinnedRepos } from '@/features/repo/repo-cookie';
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

export function VillageViewSkeleton() {
  return (
    <div className="grass-field relative h-dvh w-full overflow-hidden">
      <div aria-hidden className="village-sun absolute inset-0" />
      <div aria-hidden className="village-vignette absolute inset-0" />
      <div className="bg-background/80 absolute top-4 left-4 h-11 w-56 rounded-full border shadow-2xl backdrop-blur-md" />
      <div className="flex h-full items-center justify-center">
        <div className="grid grid-cols-3 gap-10 opacity-60">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="shimmer h-24 w-28 rounded-md" style={{ animationDelay: `${(i % 3) * 160}ms` }} />
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-5 flex justify-center px-4">
        <div className="bg-background/80 h-12 w-full max-w-xl rounded-full border shadow-2xl backdrop-blur-md" />
      </div>
    </div>
  );
}
