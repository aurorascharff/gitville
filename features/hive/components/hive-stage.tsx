'use client';

import { useHive } from '@/features/hive/hive-context';
import { HiveRoads } from '@/features/hive/components/hive-roads';
import { HiveVillager } from '@/features/hive/components/hive-villager';
import { VillageHouse } from '@/features/hive/components/village-house';
import { BUSH, PixelSprite, ROCK, TREE } from '@/features/hive/components/pixel-sprite';
import { WORLD_H, WORLD_W } from '@/features/hive/hive-world-model';

// The camera: centers the village by default; drifts toward a house when you enter it
// (the room then opens over it). One transformed plane, so zoom is a single transform.
export function HiveStage() {
  const { cells, placed, focusId, setFocusId, buzzOpen, zoom } = useHive();

  const focusCell = focusId ? cells.find(c => c.id === focusId) : null;
  const scale = focusCell ? 1.35 : zoom;
  const target = focusCell ?? { x: WORLD_W / 2, y: WORLD_H / 2 };
  const biasX = !focusCell && buzzOpen ? -140 : 0;

  return (
    <div
      className="absolute inset-0"
      onClick={e => {
        if (e.target === e.currentTarget) setFocusId(null);
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
        <HiveRoads />
        <Greenery />
        {cells.map(cell => (
          <VillageHouse key={cell.id} cell={cell} />
        ))}
        {placed.map(({ actor, x, y }) => (
          <HiveVillager key={actor.login} actor={actor} x={x} y={y} />
        ))}
      </div>
      <Fireflies />
    </div>
  );
}

// Deterministic scatter of pines, bushes, and rocks between the houses.
const DECOR: { kind: 'tree' | 'bush' | 'rock'; x: number; y: number }[] = [
  { kind: 'tree', x: 90, y: 120 }, { kind: 'tree', x: 1070, y: 90 }, { kind: 'tree', x: 60, y: 620 },
  { kind: 'tree', x: 1100, y: 660 }, { kind: 'tree', x: 300, y: 60 }, { kind: 'tree', x: 880, y: 740 },
  { kind: 'bush', x: 200, y: 300 }, { kind: 'bush', x: 980, y: 260 }, { kind: 'bush', x: 420, y: 720 },
  { kind: 'bush', x: 760, y: 100 }, { kind: 'rock', x: 140, y: 460 }, { kind: 'rock', x: 1040, y: 470 },
  { kind: 'bush', x: 620, y: 60 }, { kind: 'tree', x: 480, y: 100 },
];

function Greenery() {
  return (
    <>
      {DECOR.map((d, i) => {
        const sprite = d.kind === 'tree' ? TREE : d.kind === 'bush' ? BUSH : ROCK;
        return (
          <span key={i} aria-hidden className="pixel absolute opacity-90" style={{ left: d.x, top: d.y, transform: 'translate(-50%, -50%)' }}>
            <PixelSprite art={sprite.art} palette={sprite.palette} scale={d.kind === 'tree' ? 5 : 4} />
          </span>
        );
      })}
    </>
  );
}

// Ambient drifting lights — night village fireflies.
function Fireflies() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
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
