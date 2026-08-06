'use client';

import { ArrowUpRight, X } from 'lucide-react';
import { RelativeTime } from '@/components/ui/relative-time';
import { BARRIER, PixelSprite } from '@/features/village/components/shared/pixel-sprite';
import { useRoomSpec, useVillageData } from '@/features/village/hooks/use-village-data';
import { useVillageUi } from '@/features/village/providers/village-ui-provider';
import { wallClass } from '@/features/village/utils/room-geometry';
import { prStackForCell, type Cell } from '@/features/village/utils/village-model';
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
  const { slug } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { spec } = useRoomSpec(slug, cell.id, ai);

  const { stack, floorNo } = prStackForCell(payload, cell);
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
        'absolute inset-y-0 left-0 z-60 w-[min(340px,88vw)] overflow-hidden overscroll-contain rounded-none border-r-4 border-[#2e2418] shadow-[6px_0_18px_rgb(0_0_0/0.45)] transition-transform sm:z-50 sm:w-[min(360px,40vw)] sm:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="flex h-full flex-col bg-[#221a12]/80 text-[#f0e6d2]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close info panel"
          className="absolute top-3 right-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm border-2 border-[#4a3826] bg-[#f0e6d2] text-[#3a2f22] transition-transform hover:-translate-y-0.5 sm:hidden"
        >
          <X size={16} strokeWidth={3} />
        </button>
        <div className="shrink-0 px-6 pt-7 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {isPr ? (
              <a
                href={cell.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${cell.label} on GitHub`}
                className="flex items-center gap-1 text-[18px] leading-6 font-bold text-[#e4c05a] drop-shadow-[0_2px_0_rgb(0_0_0/0.5)] hover:underline"
              >
                {cell.label}
                <ArrowUpRight size={15} strokeWidth={3} />
              </a>
            ) : (
              <span className="text-[24px] leading-7 font-bold drop-shadow-[0_2px_0_rgb(0_0_0/0.5)]">{cell.label}</span>
            )}
            {chip ? (
              <span
                className={cn(
                  'inline-block rounded-sm border-2 border-[#2e2418] px-2 py-0.5 text-[13px] font-bold',
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
            {cell.conflict ? <StatusChip tone="danger">conflict</StatusChip> : null}
            {cell.checkState ? (
              <StatusChip tone={checkTone(cell.checkState)}>checks {checkLabel(cell.checkState)}</StatusChip>
            ) : null}
            {cell.reviewDecision ? (
              <StatusChip tone={reviewTone(cell.reviewDecision)}>{reviewLabel(cell.reviewDecision)}</StatusChip>
            ) : null}
            {cell.stale ? <StatusChip tone="quiet">stale</StatusChip> : null}
          </div>

          {desc ? (
            <p
              className={cn(
                'mt-2 font-semibold',
                isPr ? 'text-[19px] leading-6' : 'line-clamp-3 text-[16px] leading-5.5 text-[#e4d7ba]',
              )}
            >
              {desc}
            </p>
          ) : null}

          {cell.author || cell.ref ? (
            <dl className="mt-4 flex flex-col gap-2.5">
              {cell.author ? (
                <div>
                  <dt className="text-[12px] font-bold text-[#d8b24a] uppercase">Author</dt>
                  <dd className="mt-0.5 text-[15px] leading-5">
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
                  <dt className="text-[12px] font-bold text-[#d8b24a] uppercase">Branch</dt>
                  <dd className="mt-0.5 font-mono text-[13px] leading-5 wrap-anywhere text-[#d8c8a2]">
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
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4">
            <p className="mb-2.5 text-[12px] font-bold text-[#9a8c6d] uppercase">Recent commits</p>
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
                      <span className="block truncate text-[14px] leading-5 text-[#e4d7ba]">
                        {c.message.split('\n')[0]}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-[12px] text-[#9a8c6d]">
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
      </div>
    </aside>
  );
}

function StatusChip({ tone, children }: { tone: 'good' | 'warn' | 'danger' | 'quiet'; children: React.ReactNode }) {
  const colors = {
    good: 'bg-[#58a55c] text-[#0e2410]',
    warn: 'bg-[#e4c05a] text-[#3a2f22]',
    danger: 'bg-[#d95c4a] text-[#2e120e]',
    quiet: 'bg-[#2f6a3b] text-[#d7efcf]',
  };

  return (
    <span
      className={cn('rounded-sm border-2 border-[#2e2418] px-1.5 py-0.5 text-[12px] leading-4 font-bold', colors[tone])}
    >
      {children}
    </span>
  );
}

function checkTone(state: NonNullable<Cell['checkState']>): 'good' | 'warn' | 'danger' {
  if (state === 'SUCCESS') return 'good';
  if (state === 'PENDING' || state === 'EXPECTED') return 'warn';
  return 'danger';
}

function checkLabel(state: NonNullable<Cell['checkState']>): string {
  if (state === 'SUCCESS') return 'passed';
  if (state === 'PENDING' || state === 'EXPECTED') return 'running';
  return 'failed';
}

function reviewTone(decision: NonNullable<Cell['reviewDecision']>): 'good' | 'warn' | 'danger' {
  if (decision === 'APPROVED') return 'good';
  if (decision === 'CHANGES_REQUESTED') return 'danger';
  return 'warn';
}

function reviewLabel(decision: NonNullable<Cell['reviewDecision']>): string {
  if (decision === 'APPROVED') return 'approved';
  if (decision === 'CHANGES_REQUESTED') return 'changes requested';
  return 'review wanted';
}
