'use client';

import { CARPENTER, PixelSprite } from '@/features/village/components/shared/pixel-sprite';
import { useRoomSpec } from '@/features/village/use-village-data';
import type { Cell } from '@/features/village/village-model';
import { useVillageUi } from '@/features/village/village-ui-context';
import { cn } from '@/lib/utils';

export function AiPanel({ cell, ai, onToggle }: { cell: Cell; ai: boolean; onToggle: (on: boolean) => void }) {
  const { slug } = useVillageUi();
  const { spec, aiPending } = useRoomSpec(slug, cell.id, ai);
  const working = aiPending;
  if (!working && !(spec?.aiAvailable && spec.commits.length > 0)) return null;

  const status = working
    ? 'Building this room from its commits...'
    : ai
      ? spec?.ai
        ? `Showing "${spec.theme}"`
        : 'Showing the AI-built scene'
      : 'Redraw this room from its real commits as an invented scene.';

  return (
    <aside className="absolute right-4 bottom-4 z-50 w-44">
      <button
        onClick={() => onToggle(!ai)}
        role="switch"
        aria-checked={ai}
        aria-label="Visualize this room with AI"
        className={cn(
          'panel pixel flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-sm p-3 transition-transform hover:-translate-y-0.5',
          ai && 'ring-2 ring-[#e4c05a]',
        )}
      >
        <span className="relative">
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
            <PixelSprite art={CARPENTER.art} palette={CARPENTER.palette} scale={3} />
          </span>
        </span>
        <span className="font-pixel text-[12px] font-bold text-[#3a2f22]">Draw with AI</span>
        <span className="flex min-h-9 items-center text-center text-[10px] leading-tight text-[#6b5b43]">{status}</span>
        <span
          aria-hidden
          className={cn(
            'flex h-4 w-8 items-center rounded-sm border-2 border-[#4a3826] px-0.5 transition-colors',
            ai ? 'justify-end bg-[#e4c05a]' : 'justify-start bg-[#b5a687]',
          )}
        >
          <span className="h-2 w-2.5 rounded-xs border border-[#4a3826] bg-[#f7efdc]" />
        </span>
      </button>
    </aside>
  );
}
