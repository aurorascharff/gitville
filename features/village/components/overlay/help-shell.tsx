'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useVillageUi } from '@/features/village/providers/village-ui-provider';
import { cn } from '@/lib/utils';

export function VillageHelpShell({ children }: { children: ReactNode }) {
  const { focusId } = useVillageUi();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="What does everything mean?"
        className={cn(
          'panel font-pixel absolute z-50 flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm text-[15px] font-bold transition-transform hover:-translate-y-0.5 sm:h-9 sm:w-9 sm:text-[16px]',
          focusId
            ? 'bottom-[max(4.25rem,env(safe-area-inset-bottom)+4.25rem)] left-3 sm:bottom-5 sm:left-[calc(min(360px,40vw)+1rem)]'
            : 'bottom-[max(3.75rem,env(safe-area-inset-bottom)+3.75rem)] left-3 sm:bottom-5 sm:left-4',
        )}
      >
        ?
      </button>
      {open ? (
        <div
          className="absolute inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
          onClick={e => e.target === e.currentTarget && setOpen(false)}
        >
          <aside className="panel flex max-h-[86dvh] w-216 max-w-[94vw] flex-col overflow-hidden rounded-sm">
            <header className="panel-wood flex shrink-0 items-center justify-between border-x-0 border-t-0 px-5 py-2.5">
              <p className="text-[18px] font-bold">How to read the village</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close (Esc)"
                className="cursor-pointer text-[18px] font-bold text-[#e0d3b8] transition-colors hover:text-white"
              >
                x
              </button>
            </header>
            {children}
          </aside>
        </div>
      ) : null}
    </>
  );
}
