'use client';

import { Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { pinRepo } from '@/features/repo/repo-actions';

export function WatchForm() {
  const [value, setValue] = useState('');
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    startTransition(async () => {
      const res = await pinRepo(value);
      if (res && !res.ok) toast.error(res.error);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="pixel relative mx-auto flex w-full max-w-sm items-stretch overflow-hidden rounded-md border-4 border-[#4a3826] bg-[#f0e6d2] shadow-xl"
    >
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="paste a github url or owner/repo"
        disabled={pending}
        className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-sm text-[#3a2f22] placeholder:text-[#a08c66] focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending || !value.trim()}
        className="flex items-center gap-1.5 border-l-4 border-[#4a3826] bg-[#5a8f52] px-4 font-mono text-xs font-bold text-white transition-colors hover:bg-[#4d7d46] disabled:opacity-60"
      >
        {pending ? <Loader2 size={13} className="animate-spin" /> : null}
        settle
      </button>
    </form>
  );
}
