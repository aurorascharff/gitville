'use client';

import { PixelPerson } from '@/features/village/components/shared/pixel-person';
import { KindBadge } from '@/features/village/components/shared/pixel-sprite';
import { travelTo } from '@/features/village/components/stage/player';
import { useVillageUi } from '@/features/village/providers/village-ui-provider';
import { hashDelay, type Actor } from '@/features/village/utils/village-model';
import { cn } from '@/lib/utils';

export function Villager({ actor, x, y }: { actor: Actor; x: number; y: number }) {
  const { setTip } = useVillageUi();
  const delay = hashDelay(actor.login);
  const talking = actor.event.kind === 'comment' || actor.event.kind === 'review';
  const hue = hashDelay(actor.login + 'shirt') % 360;
  const shirt = `oklch(0.55 0.06 ${hue})`;

  return (
    <div
      onMouseMove={e =>
        setTip({
          x: e.clientX,
          y: e.clientY,
          title: actor.login,
          body: `${actor.event.line}${actor.event.detail ? `: ${actor.event.detail}` : ''}`,
          when: actor.event.at,
        })
      }
      onMouseLeave={() => setTip(null)}
      onClick={() => travelTo({ x: x, y: y + 26, cellId: actor.cellId })}
      data-stop-walk
      className="absolute z-10 cursor-pointer transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ transform: `translate(${x - 16}px, ${y - 30}px)` }}
    >
      <div className="pop-in flex flex-col items-center">
        <div className="sprite-bob relative flex flex-col items-center" style={{ animationDelay: `${delay}ms` }}>
          <PixelPerson name={actor.login} avatar={actor.avatar} shirt={shirt} scale={2.15} />
          <span
            className={cn(
              'absolute -top-3 -right-4 flex h-5 min-w-5 items-center justify-center drop-shadow',
              talking && 'rounded-sm border border-black/40 bg-[#f0e6d2] px-0.5 shadow',
            )}
          >
            <KindBadge kind={actor.event.kind} />
          </span>
        </div>
        <span aria-hidden className="mt-0.5 h-1.5 w-6 rounded-full bg-black/50 blur-[2px]" />
        <span className="font-pixel mt-0.5 max-w-32 truncate rounded-sm bg-black/50 px-1 text-[11px] leading-4 text-white">
          {actor.login}
        </span>
      </div>
    </div>
  );
}
