'use client';

import { ArrowUpRight } from 'lucide-react';
import { BARRIER, PixelSprite } from '@/features/village/components/pixel-sprite';
import { useVillageData } from '@/features/village/use-village-data';
import { pickedPrs, type Cell } from '@/features/village/village-model';
import { useVillageUi } from '@/features/village/village-ui-context';
import { cn } from '@/lib/utils';

export function HouseSign({ cell }: { cell: Cell }) {
  const { slug, setFocusId } = useVillageUi();
  const { payload } = useVillageData(slug);

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
  const chip =
    cell.kind !== 'pr'
      ? null
      : stack.length > 1
        ? `⌂ ${floorNo}/${stack.length}`
        : cell.prState === 'ready'
          ? 'ready'
          : null;

  return (
    <aside className="panel absolute top-4 left-4 z-50 max-h-[60dvh] w-80 max-w-[calc(100vw-8.5rem)] overflow-y-auto rounded-sm p-3">
      <p className="font-pixel text-[17px] leading-5 font-bold">{cell.label}</p>
      <p className="mt-1 line-clamp-2 min-h-9 text-[13px] leading-4.5 text-[#5a4a32]">{cell.sub}</p>
      <span className="mt-2 flex items-center gap-1.5">
        {chip ? (
          <span
            className={cn(
              'font-pixel inline-block rounded-sm border-2 border-[#4a3826] px-1.5 py-0.5 text-[11px] font-bold',
              stack.length > 1 ? 'bg-[#8a6a9d] text-white' : 'bg-[#58a55c] text-white',
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
      </span>
      {cell.ref ? (
        <p className="mt-2 truncate font-mono text-[11px] text-[#6b5b43]">
          {cell.ref} → {cell.baseRef}
        </p>
      ) : null}
      {cell.author ? <p className="mt-1 text-[12px] text-[#6b5b43]">by {cell.author}</p> : null}

      {stack.length > 1 ? (
        <div className="mt-2 border-t-2 border-[#4a3826]/40 pt-1.5">
          <ul className="mt-1 flex flex-col gap-0.5">
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
                      'flex w-full min-w-0 items-baseline gap-1.5 rounded-xs border-2 px-1.5 py-0.5 text-left',
                      here ? 'border-[#4a3826] bg-[#e0d3b8]' : 'border-transparent hover:border-[#4a3826]/40',
                      hasHouse && !here && 'cursor-pointer',
                    )}
                  >
                    <span className="font-pixel shrink-0 text-[13px] font-bold text-[#3a2f22]">#{pr.number}</span>
                    <span className="truncate text-[13px] text-[#6b5b43]">{pr.title}</span>
                    {pr.draft ? (
                      <span className="pixel shrink-0 self-center" title="draft">
                        <PixelSprite art={BARRIER.art} palette={BARRIER.palette} scale={2} />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <div className="mt-2 border-t-2 border-[#4a3826]/40 pt-2">
        <a
          href={cell.url}
          target="_blank"
          rel="noreferrer"
          className="font-pixel flex items-center gap-1 text-[12px] font-bold text-[#8a4a2b] hover:underline"
        >
          open on github <ArrowUpRight size={11} strokeWidth={3} />
        </a>
      </div>
    </aside>
  );
}
