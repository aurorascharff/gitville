'use client';

import { Loader2, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Input } from '@/components/ui/input';
import type { Route } from 'next';

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const value = searchParams.get('q') ?? '';

  function updateQuery(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next) params.set('q', next);
    else params.delete('q');
    const query = params.toString();
    const href = (query ? `/?${query}` : '/') as Route;
    startTransition(() => router.push(href));
  }

  return (
    <div className="relative w-full max-w-[360px] sm:ml-auto">
      {isPending ? (
        <Loader2
          size={13}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 animate-spin text-muted-foreground"
        />
      ) : (
        <Search
          size={13}
          strokeWidth={1.75}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
        />
      )}
      <Input
        type="search"
        name="q"
        defaultValue={value}
        placeholder="Search projects"
        aria-label="Search projects"
        onChange={event => updateQuery(event.target.value)}
        className="pl-7"
      />
    </div>
  );
}
