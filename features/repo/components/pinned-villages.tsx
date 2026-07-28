import { Star } from 'lucide-react';
import Link from 'next/link';
import { plaqueClass } from '@/components/ui/plaque';
import { RepoAvatar } from '@/components/ui/repo-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { getPinnedRepos } from '@/features/repo/repo-cookie';
import { getRepoData } from '@/features/repo/repo-queries';
import { cn, formatStars } from '@/lib/utils';
import type { RepoData } from '@/types/github';
import type { Route } from 'next';

export async function PinnedVillages() {
  const slugs = await getPinnedRepos();
  const repos = await Promise.all(slugs.map(slug => getRepoData(slug)));

  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
      {repos.map((repo, i) =>
        repo ? <RepoCard key={repo.slug} repo={repo} /> : <Unavailable key={slugs[i]} slug={slugs[i]} />,
      )}
    </div>
  );
}

function RepoCard({ repo }: { repo: RepoData }) {
  return (
    <Link
      href={`/${repo.slug}` as Route}
      prefetch
      className={cn(
        plaqueClass,
        'pixel group flex min-h-36 flex-col items-center gap-2 px-3 py-3 text-center transition-transform hover:-translate-y-1',
      )}
    >
      <RepoAvatar src={repo.ownerAvatar} name={repo.owner} size={40} className="rounded-md border-2 border-black/20" />
      <span className="w-full truncate font-mono text-sm font-bold text-[#3a2f22]">{repo.name}</span>
      <span className="flex items-center gap-1 font-mono text-[10px] text-[#6b5b43]">
        <Star size={10} className="fill-[#c9a227] text-[#8a6d2a]" />
        {formatStars(repo.stars)}
      </span>
      <span className="rounded-sm bg-[#5a8f52] px-2 py-0.5 font-mono text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
        enter →
      </span>
    </Link>
  );
}

function Unavailable({ slug }: { slug: string }) {
  return (
    <div className="pixel rounded-md border-4 border-dashed border-[#4a3826]/50 px-3 py-4 text-center font-mono text-[10px] text-white/70">
      {slug} unavailable
    </div>
  );
}

export function PinnedVillagesSkeleton() {
  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="pixel flex min-h-36 flex-col items-center gap-2 rounded-md border-4 border-[#4a3826]/70 bg-[#f0e6d2]/80 px-3 py-3"
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
