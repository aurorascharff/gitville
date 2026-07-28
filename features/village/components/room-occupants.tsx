'use client';

import { AvatarImage } from '@/components/ui/avatar-image';
import { KindBadge } from '@/features/village/components/pixel-sprite';
import { WALL_H } from '@/features/village/room-geometry';
import { useTimeWindow, useVillageData, useWorldModel } from '@/features/village/use-village-data';
import type { Cell } from '@/features/village/village-model';
import { useVillageUi } from '@/features/village/village-ui-context';

export function RoomOccupants({ cell, width, height }: { cell: Cell; width: number; height: number }) {
  const { slug, scrub, setTip } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = useTimeWindow(payload, scrub);
  const { actors } = useWorldModel(payload, slug, asOf);
  const here = actors.filter(a => a.cellId === cell.id);
  if (here.length === 0) return null;

  return (
    <>
      {here.map((a, i) => {
        const ring = Math.floor(i / 10);
        const inRing = Math.min(10, here.length - ring * 10);
        const angle = ((i % 10) / inRing) * Math.PI * 2 - Math.PI / 2;
        const x = width / 2 + Math.cos(angle) * (Math.min(200, width / 2 - 90) + ring * 55);
        const y =
          WALL_H +
          (height - WALL_H) / 2 -
          20 +
          Math.sin(angle) * (Math.min(120, (height - WALL_H) / 2 - 70) + ring * 26);

        return (
          <a
            key={a.login}
            href={`https://github.com/${a.login}`}
            target="_blank"
            rel="noreferrer"
            data-stop-walk
            className="absolute flex flex-col items-center transition-transform hover:-translate-y-0.5"
            style={{ left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: Math.round(y) }}
            onMouseMove={e =>
              setTip({
                x: e.clientX,
                y: e.clientY,
                title: a.login,
                body: `${a.event.line}${a.event.detail ? `: ${a.event.detail}` : ''}`,
                when: a.event.at,
              })
            }
            onMouseLeave={() => setTip(null)}
          >
            <div className="sprite-bob relative">
              <AvatarImage
                src={a.avatar ? `${a.avatar}?size=64` : null}
                name={a.login}
                size={30}
                className="rounded-sm border-2 border-[#2e2418] shadow"
              >
                {null}
              </AvatarImage>
              <span className="absolute -top-2 -right-2">
                <KindBadge kind={a.event.kind} />
              </span>
            </div>
            <span className="font-pixel mt-0.5 rounded-sm bg-black/45 px-1 text-[11px] text-white/90">{a.login}</span>
          </a>
        );
      })}
    </>
  );
}
