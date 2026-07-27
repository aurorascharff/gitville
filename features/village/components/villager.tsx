'use client';

import { KindBadge } from '@/features/village/components/pixel-sprite';
import { travelTo } from '@/features/village/components/player';
import { hashDelay, type Actor } from '@/features/village/village-model';
import { useVillageUi } from '@/features/village/village-ui-context';
import { cn } from '@/lib/utils';

// Crisp avatar head on a pixel body; walks (transform transition) when its cell changes.
export function Villager({ actor, x, y }: { actor: Actor; x: number; y: number }) {
  const { setTip, setFocusId } = useVillageUi();
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
          body: `${actor.event.line}${actor.event.detail ? ` — ${actor.event.detail}` : ''}`,
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
          {actor.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${actor.avatar}?size=64`}
              alt={actor.login}
              width={26}
              height={26}
              className="relative z-10 rounded-full border border-black/50 shadow-md"
            />
          ) : (
            <span className="bg-secondary relative z-10 block h-[26px] w-[26px] rounded-sm border-2 border-[#2e2418]" />
          )}
          <svg width="22" height="16" viewBox="0 0 11 8" className="-mt-1 [image-rendering:pixelated]" aria-hidden>
            <rect x="2" y="0" width="7" height="4" fill={shirt} />
            <rect x="1" y="1" width="1" height="3" fill={shirt} />
            <rect x="9" y="1" width="1" height="3" fill={shirt} />
            <rect x="3" y="4" width="2" height="3" fill="#2a2d36" />
            <rect x="6" y="4" width="2" height="3" fill="#2a2d36" />
            <rect x="3" y="7" width="2" height="1" fill="#0f1115" />
            <rect x="6" y="7" width="2" height="1" fill="#0f1115" />
          </svg>
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
