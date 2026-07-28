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
  if (!working && !(spec?.aiAvailable && spec.commits.length > 0)) return null;

  const status = working
    ? 'Working on this room. You can come back later.'
    : ai
      ? spec?.ai
        ? `Showing ${spec.theme}`
        : 'Showing the AI-built scene'
      : 'Generate a themed room from the real commits.';

  return (
    <aside className="absolute top-4 right-4 z-50 w-72">
      <button
        type="button"
        onClick={() => onToggle(!ai)}
        role="switch"
        aria-checked={ai}
        aria-keyshortcuts="G"
        aria-label="Visualize this room with AI"
        className={cn(
          'panel flex min-h-20 w-full cursor-pointer items-start gap-3 rounded-sm p-3 text-left transition-transform hover:-translate-y-0.5',
          ai && 'ring-2 ring-[#e4c05a]',
        )}
      >
        <span className="pixel relative flex h-8 w-8 shrink-0 items-center justify-center">
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
            <PixelSprite art={CARPENTER.art} palette={CARPENTER.palette} scale={2.8} />
          </span>
        </span>
        <span className="flex min-w-0 flex-1 items-start gap-1.5">
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[16px] leading-5 font-bold whitespace-nowrap text-[#3a2f22]">
              <WandSparkles size={14} strokeWidth={3} />
              Draw with AI
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
