'use client';

import { WandSparkles } from 'lucide-react';
import { CARPENTER, PixelSprite } from '@/features/village/components/shared/pixel-sprite';
import { useRoomSpec } from '@/features/village/hooks/use-village-data';
import { useVillageUi } from '@/features/village/providers/village-ui-provider';
import type { Cell } from '@/features/village/utils/village-model';
import { cn } from '@/lib/utils';

export function AiPanel({ cell, ai, onToggle }: { cell: Cell; ai: boolean; onToggle: (on: boolean) => void }) {
  const { slug } = useVillageUi();
  const { spec, aiPending } = useRoomSpec(slug, cell.id, ai);
  const working = aiPending;
  const generated = Boolean(ai && spec?.ai);
  if (!working && !(spec?.aiAvailable && spec.commits.length > 0)) return null;

  const status = working
    ? 'The carpenter is fixing the furniture.'
    : generated
      ? 'The furniture is ready.'
      : ai
        ? 'The carpenter has the furniture plans.'
        : 'Ask the carpenter to fix the furniture.';
  const title = generated ? 'Furniture fixed' : ai ? 'Fixing furniture' : 'Fix furniture';

  return (
    <aside className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-50 md:top-4 md:right-4 md:w-72">
      <button
        type="button"
        onClick={() => {
          if (!ai) onToggle(true);
        }}
        disabled={ai}
        role="switch"
        aria-checked={ai}
        aria-keyshortcuts="G"
        aria-label="Ask the carpenter to fix the furniture"
        className={cn(
          'panel flex h-9 w-9 cursor-pointer items-center justify-center gap-3 rounded-sm p-1.5 text-left transition-transform hover:-translate-y-0.5 md:min-h-20 md:w-full md:items-start md:justify-start md:p-3',
          ai && 'ring-2 ring-[#e4c05a]',
          ai && 'cursor-default hover:translate-y-0',
        )}
      >
        <span className="pixel relative flex h-6 w-6 shrink-0 items-center justify-center md:h-8 md:w-8">
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
        <span className="hidden min-w-0 flex-1 items-start gap-1.5 md:flex">
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[16px] leading-5 font-bold whitespace-nowrap text-[#3a2f22]">
              <WandSparkles size={14} strokeWidth={3} />
              {title}
              <KeyHint>G</KeyHint>
            </span>
            <span className="block max-w-72 text-[14px] leading-snug text-[#6b5b43]">{status}</span>
          </span>
        </span>
      </button>
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
