'use client';

import { useRef, type ReactNode } from 'react';
import { NightGlow } from '@/features/village/components/stage/ambience';
import { VillageHouse, VillageLamp } from '@/features/village/components/stage/house';
import { Player, travelTo } from '@/features/village/components/stage/player';
import { VillageRoads } from '@/features/village/components/stage/roads';
import { Villager } from '@/features/village/components/stage/villager';
import { useVillageData } from '@/features/village/hooks/use-village-data';
import { useVillageUi } from '@/features/village/providers/village-ui-provider';
import {
  timeWindowFor,
  TOWN_EXIT,
  WORLD_H,
  worldModelFor,
  WORLD_W,
  type Cell,
} from '@/features/village/utils/village-model';
import { cn } from '@/lib/utils';
import type { RepoData } from '@/types/github';

function lampSpots(cells: Cell[]): { x: number; y: number }[] {
  return cells
    .filter(c => c.kind !== 'inbox' && !c.hidden)
    .map((c, i) => ({ x: c.x + (i % 2 === 0 ? 138 : -138), y: c.y - 8 }));
}

export function VillageStageSurface({ terrain, sky, repo }: { terrain: ReactNode; sky: ReactNode; repo: RepoData }) {
  const { slug, scrub, focusId, zoom } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = timeWindowFor(payload, scrub);
  const { cells, placed, occupied } = worldModelFor(payload, slug, asOf, repo);
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
        {terrain}
        <TownExitGate />
        <VillageRoads cells={cells} />

        {lamps.map((l, i) => (
          <VillageLamp key={i} x={l.x} y={l.y} />
        ))}
        {cells
          .filter(c => !c.hidden)
          .map(cell => (
            <VillageHouse
              key={cell.id}
              cell={cell}
              people={occupied.get(cell.id) ?? 0}
              repo={cell.kind === 'main' ? repo : undefined}
            />
          ))}
        {placed.map(({ actor, x, y }) => (
          <Villager key={actor.login} actor={actor} x={x} y={y} />
        ))}
        <Player cells={cells} worldRef={worldRef} />

        <NightGlow lamps={lamps} litCells={litCells} />
      </div>
      {sky}
    </div>
  );
}

function TownExitGate() {
  return (
    <button
      type="button"
      data-stop-walk
      onClick={() => travelTo(TOWN_EXIT)}
      className="pixel absolute z-10 cursor-pointer text-left transition-transform hover:-translate-y-1"
      style={{ left: TOWN_EXIT.x - 56, top: TOWN_EXIT.y - 118 }}
      aria-label="Walk to the road home"
    >
      <span className="absolute top-18 left-0 h-18 w-22 rounded-r-sm border-y-4 border-r-4 border-[#4a3826] bg-[#a5814e] shadow-[inset_-4px_0_0_rgb(255_255_255/0.16)]" />
      <span className="absolute top-0 left-8 h-24 w-3 bg-[#5a3b24]" />
      <span className="absolute top-4 left-0 rounded-sm border-2 border-[#4a3826] bg-[#f0e6d2] px-2 py-1 text-[12px] leading-4 font-bold whitespace-nowrap text-[#3a2f22] shadow-[3px_3px_0_rgb(0_0_0/0.28)]">
        home road
      </span>
      <span className="absolute top-30 left-16 h-8 w-2 rounded-sm bg-[#d8bb7a]" />
      <span className="absolute top-40 left-10 h-8 w-2 rounded-sm bg-[#d8bb7a]" />
    </button>
  );
}
