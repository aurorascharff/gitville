import Link from 'next/link';
import { GitvilleMark } from '@/components/gitville-mark';
import { RepoAvatar } from '@/components/ui/repo-avatar';
import { RepoSwitcherShell } from '@/features/repo/components/repo-switcher-shell';
import { UnpinRepoButton } from '@/features/repo/components/unpin-repo-button';
import { getPinnedRepos } from '@/features/repo/utils/repo-cookie';
import { cn } from '@/lib/utils';
import type { RepoData } from '@/types/github';
import type { Route } from 'next';

export async function RepoSwitcher({ repo }: { repo: RepoData }) {
  const pinned = await getPinnedRepos();

  return (
    <RepoSwitcherShell trigger={<SwitcherIdentity repo={repo} />}>
      <ul className="max-h-72 overflow-y-auto pb-1">
        {pinned.map(slug => {
          const [owner, name] = slug.split('/');
          const active = slug.toLowerCase() === repo.slug.toLowerCase();
          return (
            <li key={slug} className="group relative">
              <Link
                href={`/${slug}` as Route}
                prefetch
                className={cn(
                  'flex h-9 items-center gap-2.5 px-4 pr-9 text-sm text-[#3a2f22] transition-colors',
                  active ? 'bg-black/10 font-bold' : 'hover:bg-black/5',
                )}
              >
                <RepoAvatar
                  src={`https://github.com/${owner}.png?size=64`}
                  name={owner}
                  size={18}
                  className="rounded-full"
                />
                <span className="truncate">{name}</span>
              </Link>
              <UnpinRepoButton slug={slug} />
            </li>
          );
        })}
      </ul>
    </RepoSwitcherShell>
  );
}

export function RepoSwitcherSkeleton({ repo }: { repo: RepoData }) {
  return (
    <div className="panel flex h-11 items-center gap-2.5 rounded-sm pr-4 pl-2 text-[15px] font-bold">
      <SwitcherIdentity repo={repo} />
      <span aria-hidden className="h-3.5 w-3.5 rounded-sm bg-[#8a6d2a]/30" />
    </div>
  );
}

function SwitcherIdentity({ repo }: { repo: RepoData }) {
  return (
    <>
      <GitvilleMark size={26} />
      <RepoAvatar src={repo.ownerAvatar} name={repo.owner} size={20} className="rounded-full" />
      <span className="max-w-44 truncate text-sm font-semibold">{repo.name}</span>
    </>
  );
}
