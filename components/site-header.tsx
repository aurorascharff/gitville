import Link from 'next/link';
import { Layers, Plus } from 'lucide-react';
import { Suspense } from 'react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchBar } from '@/features/project/components/search-bar';
import { ViewerAvatar } from '@/features/user/components/viewer-avatar';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b bg-background px-4 py-3 sm:gap-6 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2.5 text-[13px] font-medium transition-colors hover:text-foreground/80">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
          <Layers size={14} strokeWidth={1.8} />
        </span>
        <span className="hidden font-mono sm:inline">next16-deploy-platform</span>
      </Link>
      <Suspense fallback={<Skeleton className="h-8 w-full max-w-[360px] sm:ml-auto" />}>
        <SearchBar />
      </Suspense>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/new">
            <Plus size={13} strokeWidth={2} />
            New
          </Link>
        </Button>
        <ThemeToggle />
        <nav aria-label="Account">
          <Suspense fallback={<Skeleton className="h-7 w-7 rounded-full" />}>
            <ViewerAvatar />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
