'use client';

import { ArrowUpRight, X } from 'lucide-react';
import { RelativeTime } from '@/components/ui/relative-time';
import { BARRIER, PixelSprite } from '@/features/village/components/shared/pixel-sprite';
import { wallClass } from '@/features/village/room-geometry';
import { useRoomSpec, useVillageData } from '@/features/village/use-village-data';
import { pickedPrs, type Cell } from '@/features/village/village-model';
import { useVillageUi } from '@/features/village/village-ui-context';
import { cn } from '@/lib/utils';

export function HouseSign({
  cell,
  ai,
  open,
  onClose,
}: {
  cell: Cell;
  ai: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const { slug, setFocusId } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { spec } = useRoomSpec(slug, cell.id, ai);

  const prs = payload.prs;
  const me = cell.kind === 'pr' ? prs.find(p => `pr:${p.number}` === cell.id) : undefined;
  let stack: typeof prs = [];
  if (me) {
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
        'absolute inset-y-0 left-0 z-60 w-[min(340px,88vw)] overflow-hidden rounded-none border-r-4 border-[#2e2418] shadow-[6px_0_18px_rgb(0_0_0/0.45)] transition-transform sm:z-50 sm:w-[min(360px,40vw)] sm:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="flex h-full flex-col bg-[#221a12]/80 text-[#f0e6d2]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close info panel"
          className="font-pixel absolute top-3 right-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm border-2 border-[#4a3826] bg-[#f0e6d2] text-[#3a2f22] transition-transform hover:-translate-y-0.5 sm:hidden"
        >
          <X size={16} strokeWidth={3} />
        </button>
        <div className="shrink-0 px-6 pt-7 pb-4">
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

        {spec?.commits?.length ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
            <p className="font-pixel mb-2.5 text-[11px] tracking-wide text-[#9a8c6d] uppercase">Recent commits</p>
            <ul className="flex flex-col gap-1">
              {spec.commits.map(c => (
                <li key={c.sha}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start gap-2 rounded-xs border-2 border-transparent px-2 py-1.5 hover:border-[#f0e6d2]/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] text-[#e4d7ba]">{c.message.split('\n')[0]}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#9a8c6d]">
                        <span className="truncate">{c.author}</span>
                        <RelativeTime date={c.at} />
                      </span>
                    </span>
                    <ArrowUpRight
                      size={13}
                      strokeWidth={3}
                      className="mt-0.5 shrink-0 text-[#8a6d2a] opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex-1" />
        )}

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
                const link = cn(base, 'cursor-pointer border-transparent text-[#e4d7ba] hover:border-[#f0e6d2]/40');
                return (
                  <li key={pr.number}>
                    {here ? (
                      <span className={cn(base, 'border-[#2e2418] bg-[#e4c05a] text-[#3a2f22]')}>{inner}</span>
                    ) : hasHouse ? (
                      <button
                        type="button"
                        onClick={() => {
                          setFocusId(`pr:${pr.number}`);
                          onClose();
                        }}
                        className={link}
                      >
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
