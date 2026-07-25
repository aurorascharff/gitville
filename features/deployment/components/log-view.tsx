import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LogLevel, LogLine } from '@/types/deployment';

const LEVEL_COLOR: Record<LogLevel, string> = {
  info: 'text-foreground',
  warn: 'text-warning',
  error: 'text-destructive',
  success: 'text-success',
  dim: 'text-muted-foreground',
};

export function BuildLogsShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <header className="border-b px-4 py-2.5">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Build logs</h3>
      </header>
      {children}
    </section>
  );
}

export function LogStreamFrame({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <div className={cn('log-stream max-h-[480px] overflow-y-auto bg-background/40 px-4 py-3', muted && 'text-muted-foreground/60')}>
      {children}
    </div>
  );
}

export function LogRow({ line }: { line: LogLine }) {
  return (
    <div className="flex gap-3 py-px">
      <span className="shrink-0 tabular-nums text-muted-foreground/70">{line.timestamp}</span>
      <span className={cn('break-words whitespace-pre-wrap', LEVEL_COLOR[line.level])}>{line.message}</span>
    </div>
  );
}

export function CursorRow() {
  return (
    <div className="flex gap-3 py-px text-muted-foreground/70">
      <span className="tabular-nums">··:··:··</span>
      <span className="animate-pulse">▌</span>
    </div>
  );
}

export function LogSkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-px">
          <Skeleton className="h-[18px] w-[58px] shrink-0" />
          <Skeleton className="h-[18px] w-[55%]" />
        </div>
      ))}
    </>
  );
}
