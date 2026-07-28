'use client';

import { useEffect } from 'react';
import { WatchForm } from '@/features/repo/components/watch-form';

export function AddVillageModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/55 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <p className="text-center text-[16px] font-bold text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.7)]">
        watch a new village
      </p>
      <WatchForm autoFocus />
      <button
        onClick={onClose}
        className="cursor-pointer text-[14px] font-semibold text-white/70 transition-colors hover:text-white"
      >
        cancel
      </button>
    </div>
  );
}
