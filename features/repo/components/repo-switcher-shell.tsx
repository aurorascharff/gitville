'use client';

import { ChevronDown, Plus } from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

const AddVillageModal = lazy(() =>
  import('@/features/repo/components/add-village-modal').then(mod => ({ default: mod.AddVillageModal })),
);

export function RepoSwitcherShell({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="panel font-pixel flex h-11 items-center gap-2.5 rounded-sm pr-4 pl-2 text-[15px] transition-transform hover:-translate-y-0.5"
      >
        {trigger}
        <ChevronDown size={14} className={cn('text-[#8a6d2a] transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="panel absolute top-13 left-0 z-40 w-72 overflow-hidden rounded-sm">
          <p className="font-pixel px-4 pt-3 pb-1.5 text-[12px] font-bold tracking-wider text-[#8a6d2a] uppercase">
            villages you watch
          </p>
          {children}
          <button
            onClick={() => {
              setOpen(false);
              setAdding(true);
            }}
            className="font-pixel flex h-11 w-full cursor-pointer items-center gap-2 border-t-2 border-[#4a3826]/30 px-4 text-[13px] font-bold text-[#3a2f22] transition-colors hover:bg-black/5"
          >
            <Plus size={15} className="text-[#5a8f52]" />
            watch a new village
          </button>
        </div>
      ) : null}

      {adding ? (
        <Suspense fallback={<AddVillageModalFallback />}>
          <AddVillageModal onClose={() => setAdding(false)} />
        </Suspense>
      ) : null}
    </div>
  );
}

function AddVillageModalFallback() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/55 p-4">
      <p className="font-pixel text-center text-[15px] font-bold text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.7)]">
        watch a new village
      </p>
      <div className="pixel h-12 w-full max-w-sm rounded-md border-4 border-[#4a3826] bg-[#f0e6d2] shadow-xl" />
    </div>
  );
}
