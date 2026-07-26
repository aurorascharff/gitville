import { notFound } from 'next/navigation';
import { preload, SWRConfig } from 'swr';
import { HiveWorld } from '@/features/hive/components/hive-world';
import { getPinnedRepos } from '@/features/repo/repo-cookie';
import { getHivePayload, getRepoData } from '@/lib/github';
import { hiveKey } from '@/types/github';

export async function HiveView({ slug }: { slug: string }) {
  const [repo, pinned] = await Promise.all([getRepoData(slug), getPinnedRepos()]);
  if (!repo) notFound();

  // Seed the client cache on the server: the world hydrates with this exact snapshot
  // (no refetch), then SWR polling takes over. This is the new preload + cacheData API.
  const cacheData = preload(hiveKey(repo.slug), () => getHivePayload(repo.slug, repo.defaultBranch));

  return (
    <SWRConfig value={{ cacheData }}>
      <HiveWorld repo={repo} pinned={pinned} />
    </SWRConfig>
  );
}

// Full-bleed loading state: the same atmosphere with a faint shimmering honeycomb,
// so the world fades in over an identical stage (no layout shift).
export function HiveViewSkeleton() {
  return (
    <div className="bg-background relative h-dvh w-full overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 46%, color-mix(in oklch, var(--brand) 7%, transparent), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(color-mix(in oklch, var(--foreground) 13%, transparent) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="bg-background/75 absolute top-4 left-4 h-11 w-56 rounded-full border shadow-2xl backdrop-blur-md" />
      <div className="flex h-full items-center justify-center">
        <div className="grid grid-cols-3 gap-8 opacity-50">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="hex shimmer h-40 w-36" style={{ animationDelay: `${(i % 3) * 160}ms` }} />
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-5 flex justify-center px-4">
        <div className="bg-background/75 h-12 w-full max-w-xl rounded-full border shadow-2xl backdrop-blur-md" />
      </div>
    </div>
  );
}
