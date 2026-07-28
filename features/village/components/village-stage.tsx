'use client';

import { useRef } from 'react';
import { Player, travelTo } from '@/features/village/components/player';
import { NightGlow, NightTint, VillageSky } from '@/features/village/components/village-ambience';
import { GrassPatches, VillageDecor } from '@/features/village/components/village-decor';
import { VillageHouse, VillageLamp } from '@/features/village/components/village-house';
import { VillageRoads } from '@/features/village/components/village-roads';
import { Villager } from '@/features/village/components/villager';
import { useVillageData, useTimeWindow, useWorldModel } from '@/features/village/use-village-data';
import { WORLD_H, WORLD_W, type Cell } from '@/features/village/village-model';
import { useVillageUi } from '@/features/village/village-ui-context';
import { cn } from '@/lib/utils';

function lampSpots(cells: Cell[]): { x: number; y: number }[] {
  return cells
    .filter(c => c.kind !== 'inbox' && !c.hidden)
    .map((c, i) => ({ x: c.x + (i % 2 === 0 ? 138 : -138), y: c.y - 8 }));
}

export function VillageStage() {
  const { slug, scrub, focusId, zoom } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = useTimeWindow(payload, scrub);
  const { cells, placed, occupied } = useWorldModel(payload, slug, asOf);
  const worldRef = useRef<HTMLDivElement>(null);

  const lamps = lampSpots(cells);
  const litCells = cells.filter(c => !c.hidden && (occupied.get(c.id) ?? 0) > 0);

  return (
    <div
      className={cn('absolute inset-0 overflow-hidden', focusId && 'hidden')}
      onClick={e => {
        if ((e.target as Element).closest('button, a, [data-stop-walk]')) return;
        const rect = worldRef.current?.getBoundingClientRect();
        if (!rect) return;
        travelTo({ x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom });
      }}
    >
      <div
        ref={worldRef}
        className="grass-field absolute top-0 left-0 will-change-transform"
        style={{
          width: WORLD_W,
          height: WORLD_H,
          transformOrigin: '0 0',
          transform: `translate(calc(50vw - ${WORLD_W / 2}px), calc(50dvh - ${WORLD_H / 2 + 170}px))`,
          boxShadow: 'inset 0 0 140px 80px rgb(14 30 18 / 0.6)',
        }}
      >
        <GrassPatches />
        <VillageRoads cells={cells} />
        <VillageDecor />
        <NightTint />

        {lamps.map((l, i) => (
          <VillageLamp key={i} x={l.x} y={l.y} />
        ))}
        {cells
          .filter(c => !c.hidden)
          .map(cell => (
            <VillageHouse key={cell.id} cell={cell} people={occupied.get(cell.id) ?? 0} />
          ))}
        {placed.map(({ actor, x, y }) => (
          <Villager key={actor.login} actor={actor} x={x} y={y} />
        ))}
        <Player cells={cells} worldRef={worldRef} />

        <NightGlow lamps={lamps} litCells={litCells} />
      </div>
      <VillageSky />
    </div>
  );
}
