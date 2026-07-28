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
        : 'Ask the carpenter to furnish this room.';
  const title = generated ? 'Furniture fixed' : ai ? 'Fixing furniture' : 'Furnish room';

  return (
    <aside className="absolute top-3 right-3 z-50 sm:top-4 sm:right-4 sm:w-72">
      <button
        type="button"
        onClick={() => {
          if (!ai) onToggle(true);
        }}
        disabled={ai}
        role="switch"
        aria-checked={ai}
        aria-keyshortcuts="G"
        aria-label="Ask the carpenter to furnish this room"
        className={cn(
          'panel flex h-11 w-11 cursor-pointer items-center justify-center gap-3 rounded-sm p-2 text-left transition-transform hover:-translate-y-0.5 sm:min-h-20 sm:w-full sm:items-start sm:justify-start sm:p-3',
          ai && 'ring-2 ring-[#e4c05a]',
          ai && 'cursor-default hover:translate-y-0',
        )}
      >
        <span className="pixel relative flex h-7 w-7 shrink-0 items-center justify-center sm:h-8 sm:w-8">
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
        <span className="hidden min-w-0 flex-1 items-start gap-1.5 sm:flex">
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
