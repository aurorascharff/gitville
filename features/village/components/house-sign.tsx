'use client';

import { ArrowUpRight } from 'lucide-react';
import { BARRIER, PixelSprite } from '@/features/village/components/pixel-sprite';
import { wallClass } from '@/features/village/room-geometry';
import { useRoomSpec, useVillageData } from '@/features/village/use-village-data';
import { pickedPrs, type Cell } from '@/features/village/village-model';
import { useVillageUi } from '@/features/village/village-ui-context';
import { cn } from '@/lib/utils';

export function HouseSign({ cell, ai }: { cell: Cell; ai: boolean }) {
  const { slug, setFocusId } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { spec } = useRoomSpec(slug, cell.id, ai);

  const prs = payload.prs;
  const me = cell.kind === 'pr' ? prs.find(p => `pr:${p.number}` === cell.id) : undefined;
  let stack: typeof prs = [];
  if (me) {
    // The stack is the whole connected component (every floor sees the same
    // set), linked by base==head branch but never through the default branch,
    // which would otherwise hub every PR based on it into one giant stack.
    const trunk = payload.defaultBranch;
    const linked = (p: (typeof prs)[number]) =>
      prs.filter(
        q =>
          q.number !== p.number &&
          ((p.baseRef !== trunk && q.branch === p.baseRef) || (q.baseRef !== trunk && q.baseRef === p.branch)),
      );
    const seen = new Set([me.number]);
    const comp = [me];
    for (let i = 0; i < comp.length; i++) {
      for (const nb of linked(comp[i])) {
        if (!seen.has(nb.number)) {
          seen.add(nb.number);
          comp.push(nb);
        }
      }
    }
    // Depth = members below this one; sorted top-floor-first for the display.
    const depth = (p: (typeof prs)[number]) => {
      let d = 0;
      let cur = p;
      const guard = new Set([p.number]);
      for (;;) {
        const parent = comp.find(q => q.branch === cur.baseRef);
        if (!parent || guard.has(parent.number)) break;
        guard.add(parent.number);
        cur = parent;
        d++;
      }
      return d;
    };
    stack = comp.slice().sort((a, b) => depth(b) - depth(a) || b.number - a.number);
  }

  const idx = stack.findIndex(p => `pr:${p.number}` === cell.id);
  const floorNo = idx >= 0 ? stack.length - idx : 1;
  // PRs lead with their title (the number is a small eyebrow); places like the
  // square or the hall lead with their name, since that is the headline there.
  const isPr = cell.kind === 'pr';
  const desc = cell.sub || spec?.title;
  const chip =
    cell.kind !== 'pr'
      ? null
      : stack.length > 1
        ? `⌂ ${floorNo}/${stack.length}`
        : cell.prState === 'ready'
          ? 'ready'
          : null;

  return (
    <aside
      className={cn(
        wallClass(cell),
        'absolute inset-y-0 left-0 z-50 w-[min(360px,40vw)] overflow-hidden rounded-none border-r-4 border-[#2e2418] shadow-[6px_0_18px_rgb(0_0_0/0.45)]',
      )}
    >
      {/* A dark scrim over the room's own wall texture: the panel reads as part
          of the scene (green hedge, wood, stone …) while light text stays legible
          on any wall colour. Fixed regions: the variable identity/title/meta
          scrolls in the top region while the stack navigator and GitHub link
          stay pinned to the bottom, so switching floors never shifts them. */}
      <div className="flex h-full flex-col bg-[#221a12]/80 text-[#f0e6d2]">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-7 pb-4">
          {/* Identity + status on one line: the "#123 / draft / 2-of-3" glance. */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'font-pixel font-bold drop-shadow-[0_2px_0_rgb(0_0_0/0.5)]',
                isPr ? 'text-[16px] text-[#e4c05a]' : 'text-[24px] leading-7',
              )}
            >
              {cell.label}
            </span>
            {chip ? (
              <span
                className={cn(
                  'font-pixel inline-block rounded-sm border-2 border-[#2e2418] px-2 py-0.5 text-[13px] font-bold',
                  stack.length > 1 ? 'bg-[#a986bd] text-[#1c1424]' : 'bg-[#58a55c] text-[#0e2410]',
                )}
              >
                {chip}
              </span>
            ) : null}
            {cell.draft ? (
              <span className="pixel" title="draft, under construction">
                <PixelSprite art={BARRIER.art} palette={BARRIER.palette} scale={3} />
              </span>
            ) : null}
          </div>

          {/* The headline you actually read: the PR/issue title, or the place name. */}
          {desc ? (
            <p
              className={cn(
                'mt-2 font-bold',
                isPr ? 'text-[20px] leading-6' : 'line-clamp-3 text-[16px] leading-5.5 text-[#e4d7ba]',
              )}
            >
              {desc}
            </p>
          ) : null}

          {/* Meta, each with a tiny label so it is obvious what you are looking at. */}
          {cell.author || cell.ref ? (
            <dl className="mt-4 flex flex-col gap-2.5">
              {cell.author ? (
                <div>
                  <dt className="font-pixel text-[11px] tracking-wide text-[#d8b24a] uppercase">Author</dt>
                  <dd className="mt-0.5 text-[15px]">
                    <a
                      href={`https://github.com/${cell.author}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#f0e6d2] underline decoration-[#f0b98a]/40 underline-offset-2 hover:decoration-[#f0b98a]"
                    >
                      {cell.author}
                    </a>
                  </dd>
                </div>
              ) : null}
              {cell.ref ? (
                <div>
                  <dt className="font-pixel text-[11px] tracking-wide text-[#d8b24a] uppercase">Branch</dt>
                  <dd className="mt-0.5 font-mono text-[13px] wrap-anywhere text-[#d8c8a2]">
                    <a
                      href={`https://github.com/${slug}/tree/${encodeURIComponent(cell.ref)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#8fd0c0] hover:underline"
                    >
                      {cell.ref}
                    </a>
                    <span className="px-1 text-[#f0b98a]">→</span>
                    {cell.baseRef ? (
                      <a
                        href={`https://github.com/${slug}/tree/${encodeURIComponent(cell.baseRef)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#e4c05a] hover:underline"
                      >
                        {cell.baseRef}
                      </a>
                    ) : null}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>

        {stack.length > 1 ? (
          <div className="max-h-[45%] shrink-0 overflow-y-auto border-t-2 border-[#f0e6d2]/15 px-6 py-4">
            <p className="font-pixel mb-2.5 text-[11px] tracking-wide text-[#9a8c6d] uppercase">In this stack</p>
            <ul className="flex flex-col gap-1">
              {stack.map(pr => {
                const here = `pr:${pr.number}` === cell.id;
                const hasHouse = pickedPrs(payload).some(p => p.number === pr.number);
                const base = 'flex w-full min-w-0 items-baseline gap-2 rounded-xs border-2 px-2 py-1.5 text-left';
                const inner = (
                  <>
                    <span className="font-pixel shrink-0 text-[15px] font-bold">#{pr.number}</span>
                    <span className="truncate text-[14px] opacity-90">{pr.title}</span>
                    {pr.draft ? (
                      <span className="pixel shrink-0 self-center" title="draft">
                        <PixelSprite art={BARRIER.art} palette={BARRIER.palette} scale={3} />
                      </span>
                    ) : null}
                  </>
                );
                // Current floor is a marker; others walk to their house, or open
                // the PR on GitHub when it has no house, so no row is a dead end.
                const link = cn(base, 'cursor-pointer border-transparent text-[#e4d7ba] hover:border-[#f0e6d2]/40');
                return (
                  <li key={pr.number}>
                    {here ? (
                      <span className={cn(base, 'border-[#2e2418] bg-[#e4c05a] text-[#3a2f22]')}>{inner}</span>
                    ) : hasHouse ? (
                      <button type="button" onClick={() => setFocusId(`pr:${pr.number}`)} className={link}>
                        {inner}
                      </button>
                    ) : (
                      <a href={pr.url} target="_blank" rel="noreferrer" className={link}>
                        {inner}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        <div className="shrink-0 border-t-2 border-[#f0e6d2]/15 px-6 py-4">
          <a
            href={cell.url}
            target="_blank"
            rel="noreferrer"
            className="font-pixel flex items-center gap-1.5 text-[15px] font-bold text-[#f0b98a] hover:underline"
          >
            open on github <ArrowUpRight size={14} strokeWidth={3} />
          </a>
        </div>
      </div>
    </aside>
  );
}
