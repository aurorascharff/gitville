'use client';

import { X } from 'lucide-react';
import { useTransition } from 'react';
import { unpinRepo } from '@/features/repo/repo-actions';

export function UnpinRepoButton({ slug }: { slug: string }) {
  const [, startTransition] = useTransition();

  return (
    <button
      aria-label={`Stop watching ${slug}`}
      onClick={() =>
        startTransition(async () => {
          await unpinRepo(slug);
        })
      }
      className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-0.5 text-[#8a6d2a] opacity-0 transition group-hover:opacity-100 hover:text-[#3a2f22]"
    >
      <X size={13} />
    </button>
  );
}
