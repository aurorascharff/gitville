'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { floorClass, wallClass } from '@/features/village/utils/room-geometry';
import type { Cell } from '@/features/village/utils/village-model';
import { cn } from '@/lib/utils';

export function StackElevator({
  floors,
  currentIndex,
  onSelect,
  onPreload,
}: {
  floors: Cell[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onPreload: (index: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [currentIndex]);

  if (floors.length < 2) return null;

  return (
    <nav
      data-stack-nav
      aria-label={`Pull request stack, ${floors.length} floors`}
      className="absolute top-[4.25rem] right-2 z-65 flex w-[82px] flex-col items-center sm:top-28 sm:right-4 sm:w-[210px]"
    >
      <div aria-hidden className="pixel flex h-5 w-[72px] items-end justify-center sm:w-[194px]">
        <span className="h-2 w-[72px] bg-[#6e3524] sm:w-[194px]" />
        <span className="absolute h-4 w-12 bg-[#9f5540] sm:w-32" />
      </div>
      <div className="w-full border-4 border-[#2e2418] bg-[#2e2418] shadow-[5px_6px_0_rgb(0_0_0/0.45)]">
        <button
          type="button"
          title="Floor above"
          aria-label="Go to the floor above"
          disabled={currentIndex === 0}
          onClick={() => onSelect(currentIndex - 1)}
          className="flex h-8 w-full items-center justify-center bg-[#e5c98f] text-[#3a2f22] hover:bg-[#f0dcad] disabled:cursor-default disabled:opacity-30"
        >
          <ChevronUp size={18} strokeWidth={4} />
        </button>
        <div
          ref={listRef}
          className="max-h-[min(52vh,360px)] overflow-y-auto overscroll-contain border-y-2 border-[#2e2418] bg-[#6b4930]"
        >
          {floors.map((floor, index) => {
            const current = index === currentIndex;
            const floorNo = floors.length - index;
            return (
              <button
                key={floor.id}
                type="button"
                aria-current={current ? 'true' : undefined}
                aria-label={`Floor ${floorNo}: ${floor.label} ${floor.sub ?? ''}`}
                title={`${floor.label} ${floor.sub ?? ''}`}
                onClick={() => onSelect(index)}
                onFocus={() => onPreload(index)}
                onMouseEnter={() => onPreload(index)}
                className={cn(
                  'group relative flex h-[58px] w-full overflow-hidden border-b-2 border-[#2e2418] text-left last:border-b-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[#f7efdc]',
                  current && 'z-10 ring-4 ring-[#f0c94f] ring-inset',
                )}
              >
                <span className="relative h-full w-full overflow-hidden">
                  <span className={cn('absolute inset-x-0 top-0 h-[25px]', wallClass(floor))} />
                  <span className={cn('absolute inset-x-0 top-[25px] bottom-0', floorClass(floor))} />
                  <span
                    aria-hidden
                    className="absolute top-2 left-2 h-3 w-3 border-2 border-[#4a3826] bg-[#b9ddf2] shadow-[13px_0_0_#b9ddf2,13px_0_0_2px_#4a3826]"
                  />
                  <span
                    aria-hidden
                    className="absolute right-2 bottom-2 h-3 w-6 border-2 border-[#3a2f22] bg-[#e4c05a]"
                  />
                  <span
                    className={cn(
                      'absolute top-1 right-1 flex h-5 min-w-5 items-center justify-center border-2 border-[#2e2418] px-0.5 text-[10px] leading-none font-black sm:hidden',
                      current ? 'bg-[#f0c94f] text-[#2e2418]' : 'bg-[#f7efdc] text-[#4a3826]',
                    )}
                  >
                    {floorNo}
                  </span>
                  <span className="absolute inset-y-0 right-0 left-[76px] hidden min-w-0 flex-col justify-center overflow-hidden bg-[#f7efdc]/92 px-2 sm:flex">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="text-[12px] leading-4 font-black text-[#3a2f22]">F{floorNo}</span>
                      <span className="min-w-0 truncate text-[12px] leading-4 font-bold text-[#8a4a2b]">
                        {floor.label}
                      </span>
                    </span>
                    <span className="truncate text-[11px] leading-4 text-[#6b5b43]">{floor.sub}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          title="Floor below"
          aria-label="Go to the floor below"
          disabled={currentIndex === floors.length - 1}
          onClick={() => onSelect(currentIndex + 1)}
          className="flex h-8 w-full items-center justify-center bg-[#e5c98f] text-[#3a2f22] hover:bg-[#f0dcad] disabled:cursor-default disabled:opacity-30"
        >
          <ChevronDown size={18} strokeWidth={4} />
        </button>
      </div>
      <div aria-hidden className="pixel flex w-[74px] justify-between sm:w-[194px]">
        <span className="h-2 w-3 bg-[#2e2418]" />
        <span className="h-2 w-3 bg-[#2e2418]" />
      </div>
    </nav>
  );
}
