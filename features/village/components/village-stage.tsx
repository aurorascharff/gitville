'use client';

import { useRef } from 'react';
import { BUSH, CROPS, FENCE, FLOWER, FLOWER_BLUE, MUSHROOM, PEBBLES, PixelSprite, POND, ROCK, STUMP, TREE, TUFT } from '@/features/village/components/pixel-sprite';
import { Player, travelTo } from '@/features/village/components/player';
import { VillageHouse, VillageLamp } from '@/features/village/components/village-house';
import { VillageRoads } from '@/features/village/components/village-roads';
import { Villager } from '@/features/village/components/villager';
import { useVillageData, useTimeWindow, useWorldModel } from '@/features/village/use-village-data';
import { WORLD_H, WORLD_W, type Cell } from '@/features/village/village-model';
import { useVillageUi } from '@/features/village/village-ui-context';
import { cn } from '@/lib/utils';

// Wide of the door so lamps never stand in the villager arc or on the name plate.
function lampSpots(cells: Cell[]): { x: number; y: number }[] {
  return cells.filter(c => c.kind !== 'inbox' && !c.hidden).map((c, i) => ({ x: c.x + (i % 2 === 0 ? 138 : -138), y: c.y - 8 }));
}

// The village at fixed scale; the camera (world transform) chases the player.
export function VillageStage() {
  const { slug, scrub, focusId } = useVillageUi();
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
        travelTo({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      <div
        ref={worldRef}
        className="grass-field absolute top-0 left-0 will-change-transform"
        style={{ width: WORLD_W, height: WORLD_H, boxShadow: 'inset 0 0 90px 46px rgb(14 30 18 / 0.55)' }}
      >
        <GrassPatches />
        <VillageRoads cells={cells} />
        <GrassDetail />
        <BorderForest />
        <Pond x={330} y={270} />
        <Pond x={1780} y={1190} />
        <Greenery />

        {/* Night falls on the terrain; buildings above carry their own night palettes. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden bg-[#141f4a] opacity-60 mix-blend-multiply dark:block" />

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

        <div aria-hidden className="pointer-events-none absolute inset-0 hidden dark:block">
          {lamps.map((l, i) => (
            <span
              key={i}
              className="absolute mix-blend-screen"
              style={{
                left: l.x - 65,
                top: l.y - 70,
                width: 130,
                height: 120,
                background: 'radial-gradient(circle, rgb(255 205 96 / 0.34), rgb(255 190 80 / 0.1) 45%, transparent 68%)',
              }}
            />
          ))}
          {litCells.map(c => (
            <span
              key={c.id}
              className="absolute mix-blend-screen"
              style={{
                left: c.x - 60,
                top: c.y - 40,
                width: 120,
                height: 90,
                background: 'radial-gradient(circle, rgb(255 200 110 / 0.22), transparent 65%)',
              }}
            />
          ))}
        </div>
      </div>
      <NightSky />
      <Fireflies />
      <Butterflies />
    </div>
  );
}

// Daytime ambience: butterflies drifting over the lawns.
function Butterflies() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden dark:hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="firefly absolute h-1.5 w-1.5 rounded-[1px]"
          style={{
            left: `${(i * 149 + 43) % 100}%`,
            top: `${(i * 97 + 31) % 100}%`,
            background: i % 2 === 0 ? '#f2ead8' : '#9db9e8',
            boxShadow: 'none',
            animationDelay: `${(i * 811) % 6000}ms`,
            animationDuration: `${6200 + ((i * 887) % 3800)}ms`,
          }}
        />
      ))}
    </div>
  );
}

const DECOR: { kind: 'tree' | 'bush' | 'rock' | 'crops' | 'fence' | 'mushroom' | 'stump'; x: number; y: number }[] = [
  { kind: 'mushroom', x: 520, y: 330 },
  { kind: 'mushroom', x: 1240, y: 1180 },
  { kind: 'mushroom', x: 1850, y: 480 },
  { kind: 'mushroom', x: 370, y: 860 },
  { kind: 'stump', x: 860, y: 250 },
  { kind: 'stump', x: 1700, y: 1360 },
  { kind: 'stump', x: 240, y: 1180 },
  { kind: 'bush', x: 760, y: 480 },
  { kind: 'bush', x: 1350, y: 680 },
  { kind: 'crops', x: 1950, y: 950 },
  { kind: 'fence', x: 1850, y: 940 },
  { kind: 'fence', x: 2050, y: 940 },
  { kind: 'crops', x: 280, y: 1060 },
  { kind: 'crops', x: 1520, y: 230 },
  { kind: 'fence', x: 380, y: 1045 },
  { kind: 'fence', x: 175, y: 1045 },
  { kind: 'fence', x: 1415, y: 215 },
  { kind: 'fence', x: 1625, y: 215 },
  { kind: 'tree', x: 150, y: 190 },
  { kind: 'tree', x: 1610, y: 140 },
  { kind: 'tree', x: 100, y: 930 },
  { kind: 'tree', x: 1660, y: 990 },
  { kind: 'tree', x: 460, y: 100 },
  { kind: 'tree', x: 1330, y: 1110 },
  { kind: 'tree', x: 730, y: 1300 },
  { kind: 'tree', x: 1990, y: 620 },
  { kind: 'tree', x: 2020, y: 1330 },
  { kind: 'tree', x: 230, y: 1350 },
  { kind: 'bush', x: 300, y: 460 },
  { kind: 'bush', x: 1470, y: 390 },
  { kind: 'bush', x: 640, y: 1090 },
  { kind: 'bush', x: 1150, y: 150 },
  { kind: 'bush', x: 930, y: 90 },
  { kind: 'bush', x: 1890, y: 890 },
  { kind: 'rock', x: 210, y: 700 },
  { kind: 'rock', x: 1560, y: 700 },
  { kind: 'rock', x: 1050, y: 1420 },
  { kind: 'tree', x: 720, y: 150 },
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
                  : d.kind === 'mushroom'
                    ? MUSHROOM
                    : d.kind === 'stump'
                      ? STUMP
                      : ROCK;
        const scale = d.kind === 'tree' ? 5 : d.kind === 'crops' ? 6 : d.kind === 'mushroom' ? 3 : 4;
        return (
          <span
            key={i}
            aria-hidden
            className="pixel pointer-events-none absolute opacity-90"
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
    <span aria-hidden className="pixel pointer-events-none absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <PixelSprite art={POND.art} palette={POND.palette} scale={7} />
    </span>
  );
}

function BorderForest() {
  const spots: { x: number; y: number }[] = [];
  const cols = Math.floor(WORLD_W / 100);
  const rows = Math.floor(WORLD_H / 110);
  for (let i = 0; i < cols; i++) spots.push({ x: 40 + i * 100 + ((i * 37) % 28), y: 18 + ((i * 53) % 26) });
  for (let i = 0; i < cols; i++) spots.push({ x: 70 + i * 100 + ((i * 61) % 26), y: WORLD_H - 30 - ((i * 43) % 24) });
  for (let i = 0; i < rows; i++) spots.push({ x: 22 + ((i * 47) % 24), y: 100 + i * 110 });
  for (let i = 0; i < rows; i++) spots.push({ x: WORLD_W - 26 - ((i * 59) % 24), y: 130 + i * 110 });
  return (
    <>
      {spots.map((t, i) => (
        <span
          key={i}
          aria-hidden
          className="pixel pointer-events-none absolute"
          style={{ left: t.x, top: t.y, transform: 'translate(-50%, -50%)' }}
        >
          <PixelSprite art={TREE.art} palette={TREE.palette} scale={i % 3 === 0 ? 6 : 5} />
        </span>
      ))}
    </>
  );
}

function GrassPatches() {
  const patches = [
    { x: 240, y: 384, w: 456, h: 312, tone: 'light' },
    { x: 1344, y: 192, w: 504, h: 360, tone: 'dark' },
    { x: 1584, y: 936, w: 456, h: 384, tone: 'light' },
    { x: 384, y: 1056, w: 504, h: 336, tone: 'dark' },
    { x: 960, y: 624, w: 576, h: 456, tone: 'light' },
  ];
  return (
    <>
      {patches.map((p, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: p.x,
            top: p.y,
            width: p.w,
            height: p.h,
            backgroundImage: `repeating-conic-gradient(${
              p.tone === 'light' ? 'rgb(255 255 255 / 0.055)' : 'rgb(0 0 0 / 0.06)'
            } 0% 25%, transparent 0% 50%)`,
            backgroundSize: '24px 24px',
          }}
        />
      ))}
    </>
  );
}

function GrassDetail() {
  return (
    <>
      {Array.from({ length: 170 }).map((_, i) => {
        const x = ((i * 397 + 131) % (WORLD_W - 60)) + 30;
        const y = ((i * 683 + 71) % (WORLD_H - 60)) + 30;
        const sprite = i % 9 === 0 ? FLOWER : i % 9 === 4 ? FLOWER_BLUE : i % 9 === 7 ? PEBBLES : TUFT;
        return (
          <span key={i} aria-hidden className="pixel pointer-events-none absolute opacity-80" style={{ left: x, top: y }}>
            <PixelSprite art={sprite.art} palette={sprite.palette} scale={3} />
          </span>
        );
      })}
    </>
  );
}

function NightSky() {
  return (
    <>
      <div aria-hidden className="stars pointer-events-none absolute inset-0 hidden dark:block" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 hidden h-40 bg-linear-to-b from-[#0a1030]/70 to-transparent dark:block"
      />
      <span
        aria-hidden
        className="pixel absolute top-10 right-28 hidden h-10 w-10 rounded-full bg-[#e8e4d2] shadow-[inset_-7px_-5px_0_#c9c4ae,0_0_28px_8px_rgb(226_233_255/0.28)] dark:block"
      />
    </>
  );
}

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
