'use client';

import { WandSparkles } from 'lucide-react';
import { CARPENTER, PixelSprite } from '@/features/village/components/shared/pixel-sprite';
import { cn } from '@/lib/utils';
import type { RoomSpecPayload } from '@/types/github';

export function AiPanel({
  ai,
  onGenerate,
  pending,
  spec,
}: {
  ai: boolean;
  onGenerate: () => void;
  pending: boolean;
  spec: RoomSpecPayload | null;
}) {
  const working = pending;
  const generated = Boolean(ai && spec?.ai);
  const highlighted = ai || working;
  if (!working && !(spec?.aiAvailable && spec.commits.length > 0)) return null;

  const status = working
    ? 'Leave it with the carpenter. Come back later.'
    : generated
      ? 'Ready.'
      : ai
        ? 'Still using commit furniture.'
        : 'Use real commits.';
  const title = generated
    ? 'Furniture fixed'
    : working
      ? 'Carpenter at work'
      : ai
        ? 'Try carpenter again'
        : 'Fix furniture';

  return (
    <aside className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-50 md:top-8 md:right-4 md:w-72">
      <button
        type="button"
        onClick={onGenerate}
        disabled={generated || working}
        role="switch"
        aria-checked={generated}
        aria-keyshortcuts="G"
        aria-label={
          working ? 'Carpenter is furnishing this room. Come back later.' : 'Ask the carpenter to fix the furniture'
        }
        className={cn(
          'panel flex h-9 w-9 cursor-pointer items-center justify-center gap-3 rounded-sm p-1.5 text-left transition-transform hover:-translate-y-0.5 md:min-h-16 md:w-full md:justify-start md:px-3 md:py-4',
          highlighted && 'ring-2 ring-[#e4c05a]',
          highlighted && 'cursor-default hover:translate-y-0',
        )}
      >
        <span className="pixel relative flex h-6 w-6 shrink-0 items-center justify-center md:h-10 md:w-10">
          {working ? (
            <span aria-hidden className="absolute -top-1 -right-2">
              {[0, 1].map(i => (
                <span
                  key={i}
                  className="smoke-puff absolute h-1.5 w-1.5 rounded-full bg-[#d8c9a8]"
                  style={{ animationDelay: `${i * 800}ms` }}
                />
              ))}
            </span>
          ) : null}
          <span className={cn('block', working && 'sprite-bob')}>
            <PixelSprite art={CARPENTER.art} palette={CARPENTER.palette} scale={2.3} />
          </span>
        </span>
        <span className="hidden min-w-0 flex-1 items-center gap-1.5 md:flex">
          <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            <span className="flex min-w-0 items-center gap-1.5 text-[15px] leading-5 font-bold whitespace-nowrap text-[#3a2f22]">
              <WandSparkles size={14} strokeWidth={3} />
              <span className="truncate">{title}</span>
              <KeyHint>G</KeyHint>
            </span>
            <span className="block text-[13px] leading-4 text-[#6b5b43]">{status}</span>
          </span>
        </span>
      </button>
    </aside>
  );
}

export function AiPanelSkeleton() {
  return (
    <aside
      aria-hidden
      className="panel absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-50 flex h-9 w-9 items-center justify-center rounded-sm p-1.5 md:top-8 md:right-4 md:min-h-16 md:w-72 md:justify-start md:gap-3 md:px-3 md:py-4"
    >
      <span className="pixel flex h-6 w-6 shrink-0 items-center justify-center opacity-45 md:h-10 md:w-10">
        <PixelSprite art={CARPENTER.art} palette={CARPENTER.palette} scale={2.3} />
      </span>
      <span className="hidden min-w-0 flex-1 flex-col gap-2 md:flex">
        <span className="h-3 w-28 rounded-xs bg-[#6b5b43]/25" />
        <span className="h-2.5 w-20 rounded-xs bg-[#6b5b43]/15" />
      </span>
    </aside>
  );
}

function KeyHint({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'font-pixel inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-sm border-2 border-[#4a3826] bg-[#f7efdc] px-1 text-[10px] text-[#3a2f22]',
        className,
      )}
    >
      {children}
    </span>
  );
}
