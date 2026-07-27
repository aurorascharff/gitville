'use client';

import { ChevronDown, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { GitvilleMark } from '@/components/gitville-mark';
import { RepoAvatar } from '@/components/ui/repo-avatar';
import { pinRepo, unpinRepo } from '@/features/repo/repo-actions';
import { cn } from '@/lib/utils';
import type { RepoData } from '@/types/github';
import type { Route } from 'next';

// The HUD identity pill: village mark + current repo, opening a panel with the
// watchlist and a "watch a repo" input.
export function RepoSwitcher({ repo, pinned }: { repo: RepoData; pinned: string[] }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function watch(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    startTransition(async () => {
      const res = await pinRepo(value);
      // Only returns on failure — success redirects to the new repo.
      if (res && !res.ok) toast.error(res.error);
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="panel font-pixel flex h-11 items-center gap-2.5 rounded-sm pr-4 pl-2 text-[15px] transition-transform hover:-translate-y-0.5"
      >
        <GitvilleMark size={26} />
        <RepoAvatar src={repo.ownerAvatar} name={repo.owner} size={20} className="rounded-full" />
        <span className="max-w-44 truncate text-sm font-semibold tracking-tight">{repo.name}</span>
        <ChevronDown size={14} className={cn('text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="panel absolute top-13 left-0 z-40 w-72 overflow-hidden rounded-sm">
          <p className="font-pixel px-4 pt-3 pb-1.5 text-[12px] font-bold tracking-wider text-[#8a6d2a] uppercase">
            Watching
          </p>
          <ul className="max-h-72 overflow-y-auto pb-1">
            {pinned.map(slug => {
              const [owner, name] = slug.split('/');
              const active = slug.toLowerCase() === repo.slug.toLowerCase();
              return (
                <li key={slug} className="group relative">
                  <Link
                    href={`/${slug}` as Route}
                    prefetch
                    onClick={() => setOpen(false)}
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
                  <button
                    aria-label={`Stop watching ${slug}`}
                    onClick={() =>
                      startTransition(async () => {
                        await unpinRepo(slug);
                      })
                    }
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded p-0.5 opacity-0 transition group-hover:opacity-100"
                  >
                    <X size={13} />
                  </button>
                </li>
              );
            })}
          </ul>
          <form onSubmit={watch} className="relative border-t p-2">
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="watch a repo… owner/repo"
              disabled={pending}
              className="placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring h-8 w-full rounded-lg border bg-transparent px-2.5 text-xs focus-visible:ring-1 focus-visible:outline-none"
            />
            {pending ? (
              <Loader2
                size={13}
                className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 animate-spin"
              />
            ) : null}
          </form>
        </div>
      ) : null}
    </div>
  );
}
