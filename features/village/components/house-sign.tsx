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
  const stack: typeof prs = [];
  if (me) {
    const seen = new Set([me.number]);
    let cur = me;
    for (;;) {
      const child = prs.find(p => p.baseRef === cur.branch && !seen.has(p.number));
      if (!child) break;
      stack.unshift(child);
      seen.add(child.number);
      cur = child;
    }
    stack.push(me);
    cur = me;
    for (;;) {
      const parent = prs.find(p => p.branch === cur.baseRef && !seen.has(p.number));
      if (!parent) break;
      stack.push(parent);
      seen.add(parent.number);
      cur = parent;
    }
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
        'absolute inset-y-0 left-0 z-50 w-[min(360px,40vw)] overflow-y-auto rounded-none border-r-4 border-[#2e2418] shadow-[6px_0_18px_rgb(0_0_0/0.45)]',
      )}
    >
      {/* A dark scrim over the room's own wall texture: the panel reads as part
          of the scene (green hedge, wood, stone …) while light text stays legible
          on any wall colour. */}
      <div className="min-h-full bg-[#221a12]/80 px-6 py-7 text-[#f0e6d2]">
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
                <dt className="font-pixel text-[11px] tracking-wide text-[#9a8c6d] uppercase">Author</dt>
                <dd className="mt-0.5 text-[15px] text-[#e4d7ba]">{cell.author}</dd>
              </div>
            ) : null}
            {cell.ref ? (
              <div>
                <dt className="font-pixel text-[11px] tracking-wide text-[#9a8c6d] uppercase">Branch</dt>
                <dd className="mt-0.5 truncate font-mono text-[13px] text-[#c9b892]">
                  {cell.ref} → {cell.baseRef}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {stack.length > 1 ? (
          <div className="mt-5 border-t-2 border-[#f0e6d2]/15 pt-4">
            <p className="font-pixel mb-2.5 text-[11px] tracking-wide text-[#9a8c6d] uppercase">In this stack</p>
            <ul className="flex flex-col gap-1">
              {stack.map(pr => {
                const here = `pr:${pr.number}` === cell.id;
                const hasHouse = pickedPrs(payload).some(p => p.number === pr.number);
                return (
                  <li key={pr.number}>
                    <button
                      type="button"
                      disabled={!hasHouse || here}
                      onClick={() => setFocusId(`pr:${pr.number}`)}
                      className={cn(
                        'flex w-full min-w-0 items-baseline gap-2 rounded-xs border-2 px-2 py-1.5 text-left',
                        here
                          ? 'border-[#2e2418] bg-[#e4c05a] text-[#3a2f22]'
                          : 'border-transparent text-[#e4d7ba] hover:border-[#f0e6d2]/40',
                        hasHouse && !here && 'cursor-pointer',
                      )}
                    >
                      <span className="font-pixel shrink-0 text-[15px] font-bold">#{pr.number}</span>
                      <span className="truncate text-[14px] opacity-90">{pr.title}</span>
                      {pr.draft ? (
                        <span className="pixel shrink-0 self-center" title="draft">
                          <PixelSprite art={BARRIER.art} palette={BARRIER.palette} scale={3} />
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        <div className="mt-5 border-t-2 border-[#f0e6d2]/15 pt-4">
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
