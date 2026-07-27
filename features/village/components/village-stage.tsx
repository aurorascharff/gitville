'use client';

import { useEffect, useState } from 'react';
import { BUSH, CROPS, FENCE, PixelSprite, ROCK, TREE } from '@/features/village/components/pixel-sprite';
import { Player, travelTo } from '@/features/village/components/player';
import { VillageHouse } from '@/features/village/components/village-house';
import { VillageRoads } from '@/features/village/components/village-roads';
import { Villager } from '@/features/village/components/villager';
import { useVillageData, useTimeWindow, useWorldModel } from '@/features/village/use-village-data';
import { WORLD_H, WORLD_W } from '@/features/village/village-model';
import { useVillageUi } from '@/features/village/village-ui-context';

function useFitScale(): number {
  const [fit, setFit] = useState(1);
  useEffect(() => {
    const update = () => setFit(Math.min(1, window.innerWidth / (WORLD_W + 60), window.innerHeight / (WORLD_H + 140)));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return fit;
}

export function VillageStage() {
  const { slug, scrub, zoom, buzzOpen, focusId, setFocusId } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = useTimeWindow(payload, scrub);
  const { cells, placed, occupied, weights } = useWorldModel(payload, slug, asOf);
  const fit = useFitScale();

  const focusCell = focusId ? cells.find(c => c.id === focusId) : null;
  const scale = (focusCell ? 1.35 : zoom) * fit;
  const target = focusCell ?? { x: WORLD_W / 2, y: WORLD_H / 2 };
  const biasX = !focusCell && buzzOpen ? -140 : 0;

  return (
    <div
      className="absolute inset-0"
      onClick={e => {
        if (e.target !== e.currentTarget) return;
        if (focusId) {
          setFocusId(null);
          return;
        }
        const wx = (e.clientX - (window.innerWidth / 2 + biasX - target.x * scale)) / scale;
        const wy = (e.clientY - (window.innerHeight / 2 - target.y * scale)) / scale;
        travelTo({ x: wx, y: wy });
      }}
    >
      <div
        className="absolute top-0 left-0 transition-transform duration-700 ease-[cubic-bezier(0.3,0.9,0.3,1)]"
        style={{
          width: WORLD_W,
          height: WORLD_H,
          transformOrigin: '0 0',
          transform: `translate(calc(50vw + ${biasX - target.x * scale}px), calc(50dvh + ${-target.y * scale}px)) scale(${scale})`,
        }}
      >
        <VillageRoads cells={cells} />
        <Pond x={210} y={180} />
        <Pond x={960} y={640} />
        <Greenery />
        {cells.map(cell => (
          <VillageHouse
            key={cell.id}
            cell={cell}
            people={occupied.get(cell.id) ?? 0}
            built={weights.get(cell.id) ?? 0}
          />
        ))}
        {placed.map(({ actor, x, y }) => (
          <Villager key={actor.login} actor={actor} x={x} y={y} />
        ))}
        <Player cells={cells} />
      </div>
      <NightSky />
      <Fireflies />
    </div>
  );
}

const DECOR: { kind: 'tree' | 'bush' | 'rock' | 'crops' | 'fence'; x: number; y: number }[] = [
  { kind: 'crops', x: 180, y: 700 },
  { kind: 'crops', x: 1010, y: 150 },
  { kind: 'fence', x: 250, y: 690 },
  { kind: 'fence', x: 110, y: 690 },
  { kind: 'fence', x: 940, y: 140 },
  { kind: 'fence', x: 1080, y: 140 },
  { kind: 'tree', x: 90, y: 120 },
  { kind: 'tree', x: 1070, y: 90 },
  { kind: 'tree', x: 60, y: 620 },
  { kind: 'tree', x: 1100, y: 660 },
  { kind: 'tree', x: 300, y: 60 },
  { kind: 'tree', x: 880, y: 740 },
  { kind: 'bush', x: 200, y: 300 },
  { kind: 'bush', x: 980, y: 260 },
  { kind: 'bush', x: 420, y: 720 },
  { kind: 'bush', x: 760, y: 100 },
  { kind: 'rock', x: 140, y: 460 },
  { kind: 'rock', x: 1040, y: 470 },
  { kind: 'bush', x: 620, y: 60 },
  { kind: 'tree', x: 480, y: 100 },
];

function Greenery() {
  return (
    <>
      {DECOR.map((d, i) => {
        const sprite =
          d.kind === 'tree'
            ? TREE
            : d.kind === 'bush'
              ? BUSH
              : d.kind === 'crops'
                ? CROPS
                : d.kind === 'fence'
                  ? FENCE
                  : ROCK;
        const scale = d.kind === 'tree' ? 5 : d.kind === 'crops' ? 6 : 4;
        return (
          <span
            key={i}
            aria-hidden
            className="pixel absolute opacity-90"
            style={{ left: d.x, top: d.y, transform: 'translate(-50%, -50%)' }}
          >
            <PixelSprite art={sprite.art} palette={sprite.palette} scale={scale} />
          </span>
        );
      })}
    </>
  );
}

function Pond({ x, y }: { x: number; y: number }) {
  return (
    <span aria-hidden className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <span className="block h-16 w-28 rounded-[45%] bg-[#3d6f9e] shadow-[inset_0_4px_0_#5a8fc0,inset_0_-4px_0_#2e567c]" />
    </span>
  );
}

function NightSky() {
  return (
    <>
      <div aria-hidden className="stars pointer-events-none absolute inset-0 hidden opacity-50 dark:block" />
      <span
        aria-hidden
        className="pixel absolute top-8 right-24 hidden h-8 w-8 rounded-full bg-[#e8e4d2] shadow-[inset_-6px_-4px_0_#c9c4ae] dark:block"
      />
      <span
        aria-hidden
        className="pixel absolute top-8 right-24 block h-8 w-8 rounded-full bg-[#ffd76a] shadow-[0_0_24px_6px_rgb(255_215_106/0.5)] dark:hidden"
      />
    </>
  );
}

// Night-only ambience.
function Fireflies() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden dark:block">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="firefly absolute h-1 w-1 rounded-full bg-[#ffd76a]/70"
          style={{
            left: `${(i * 137 + 61) % 100}%`,
            top: `${(i * 89 + 23) % 100}%`,
            animationDelay: `${(i * 733) % 6000}ms`,
            animationDuration: `${5200 + ((i * 997) % 4200)}ms`,
          }}
        />
      ))}
    </div>
  );
}
