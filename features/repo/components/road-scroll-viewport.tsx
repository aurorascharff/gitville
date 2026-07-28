'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PixelPerson } from '@/features/village/components/shared/pixel-person';
import type { ReactNode } from 'react';

export function RoadScrollViewport({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const lastScrollLeft = useRef(0);
  const walkingTimer = useRef<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [runnerDirection, setRunnerDirection] = useState<1 | -1>(1);
  const [runnerWalking, setRunnerWalking] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const delta = el.scrollLeft - lastScrollLeft.current;
      if (Math.abs(delta) > 4) {
        setRunnerDirection(delta > 0 ? 1 : -1);
        setRunnerWalking(true);
        if (walkingTimer.current) window.clearTimeout(walkingTimer.current);
        walkingTimer.current = window.setTimeout(() => setRunnerWalking(false), 360);
      }
      lastScrollLeft.current = el.scrollLeft;
      setCanScrollLeft(el.scrollLeft > 8);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      if (walkingTimer.current) window.clearTimeout(walkingTimer.current);
      observer.disconnect();
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const scrollBy = (direction: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.min(520, el.clientWidth * 0.72), behavior: 'smooth' });
  };

  return (
    <div className="relative w-full">
      <div
        ref={ref}
        tabIndex={0}
        aria-label="Scrollable repo road"
        onKeyDown={e => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            scrollBy(-1);
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            scrollBy(1);
          }
        }}
        className="w-full [scrollbar-width:none] overflow-x-auto px-2 py-4 focus-visible:ring-2 focus-visible:ring-[#e4c05a] focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {canScrollLeft || canScrollRight ? (
        <span
          aria-hidden
          className="pixel pointer-events-none absolute top-[124px] left-1/2 z-30 drop-shadow-[2px_3px_0_rgb(0_0_0/0.3)] transition-transform duration-200"
          style={{
            transform: `translateX(-50%) scaleX(${runnerDirection})`,
          }}
        >
          <span className={runnerWalking ? 'player-walk block' : 'block'}>
            <PixelPerson name="road runner" shirt="#7aa05f" pants="#2a2d36" scale={2.3} />
          </span>
        </span>
      ) : null}
      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll road left"
          className="panel absolute top-20 left-3 z-20 flex h-11 w-9 cursor-pointer items-center justify-center rounded-sm text-[#3a2f22] shadow-[3px_3px_0_rgb(0_0_0/0.25)] transition-transform hover:-translate-y-1"
        >
          <ChevronLeft size={20} strokeWidth={3} />
        </button>
      ) : null}
      {canScrollRight ? (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll road right"
          className="panel absolute top-20 right-3 z-20 flex h-11 w-9 cursor-pointer items-center justify-center rounded-sm text-[#3a2f22] shadow-[3px_3px_0_rgb(0_0_0/0.25)] transition-transform hover:-translate-y-1"
        >
          <ChevronRight size={20} strokeWidth={3} />
        </button>
      ) : null}
    </div>
  );
}
