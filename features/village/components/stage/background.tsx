import {
  BUSH,
  CROPS,
  FENCE,
  FLOWER,
  FLOWER_BLUE,
  LILY_PAD,
  MUSHROOM,
  PEBBLES,
  POND,
  REEDS,
  ROCK,
  Sprite,
  STUMP,
  TREE,
  TUFT,
} from '@/features/village/components/shared/pixel-sprite';
import { Placed } from '@/features/village/components/shared/placed';
import { roadLayoutFor, type Point } from '@/features/village/components/stage/roads';
import { WORLD_H, WORLD_W, type Cell } from '@/features/village/utils/village-model';

type DecorKind = 'tree' | 'bush' | 'rock' | 'crops' | 'fence' | 'mushroom' | 'stump' | 'tuft' | 'flower' | 'flowerBlue';
type DecorItem = { kind: DecorKind; x: number; y: number };
type Blocker = Point & { radius: number };

const DECOR: DecorItem[] = [
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
  { kind: 'tree', x: 520, y: 1420 },
  { kind: 'tree', x: 1180, y: 1320 },
  { kind: 'tree', x: 2140, y: 360 },
  { kind: 'tree', x: 2580, y: 1380 },
  { kind: 'bush', x: 460, y: 760 },
  { kind: 'bush', x: 820, y: 920 },
  { kind: 'bush', x: 1260, y: 1480 },
  { kind: 'bush', x: 1760, y: 260 },
  { kind: 'bush', x: 2240, y: 1080 },
  { kind: 'bush', x: 2740, y: 720 },
  { kind: 'tuft', x: 360, y: 620 },
  { kind: 'tuft', x: 660, y: 380 },
  { kind: 'tuft', x: 1080, y: 960 },
  { kind: 'tuft', x: 1540, y: 520 },
  { kind: 'tuft', x: 2060, y: 820 },
  { kind: 'tuft', x: 2440, y: 440 },
  { kind: 'tuft', x: 2860, y: 1120 },
  { kind: 'flower', x: 500, y: 1180 },
  { kind: 'flower', x: 980, y: 520 },
  { kind: 'flower', x: 1440, y: 860 },
  { kind: 'flower', x: 2360, y: 1460 },
  { kind: 'flowerBlue', x: 720, y: 1120 },
  { kind: 'flowerBlue', x: 1680, y: 760 },
  { kind: 'flowerBlue', x: 2140, y: 1260 },
  { kind: 'mushroom', x: 1120, y: 1500 },
  { kind: 'mushroom', x: 2520, y: 980 },
  { kind: 'rock', x: 3020, y: 840 },
];

const SAFE_DECOR: DecorItem[] = [
  { kind: 'tree', x: 220, y: 360 },
  { kind: 'tree', x: 360, y: 860 },
  { kind: 'tree', x: 520, y: 1540 },
  { kind: 'tree', x: 960, y: 220 },
  { kind: 'tree', x: 1080, y: 1460 },
  { kind: 'tree', x: 1420, y: 1370 },
  { kind: 'tree', x: 1960, y: 360 },
  { kind: 'tree', x: 2060, y: 1460 },
  { kind: 'tree', x: 2380, y: 1220 },
  { kind: 'tree', x: 2860, y: 420 },
  { kind: 'tree', x: 3020, y: 1260 },
  { kind: 'bush', x: 260, y: 620 },
  { kind: 'bush', x: 420, y: 1320 },
  { kind: 'bush', x: 680, y: 420 },
  { kind: 'bush', x: 880, y: 1380 },
  { kind: 'bush', x: 1320, y: 260 },
  { kind: 'bush', x: 1600, y: 1040 },
  { kind: 'bush', x: 2200, y: 680 },
  { kind: 'bush', x: 2420, y: 360 },
  { kind: 'bush', x: 2840, y: 1020 },
  { kind: 'rock', x: 620, y: 760 },
  { kind: 'rock', x: 1720, y: 1320 },
  { kind: 'rock', x: 2260, y: 1160 },
  { kind: 'mushroom', x: 2500, y: 920 },
  { kind: 'mushroom', x: 820, y: 1160 },
  { kind: 'stump', x: 300, y: 1220 },
  { kind: 'stump', x: 1480, y: 1520 },
  { kind: 'crops', x: 2680, y: 1520 },
  { kind: 'fence', x: 2570, y: 1505 },
  { kind: 'fence', x: 2790, y: 1505 },
  { kind: 'tuft', x: 320, y: 780 },
  { kind: 'tuft', x: 760, y: 1540 },
  { kind: 'tuft', x: 1180, y: 360 },
  { kind: 'tuft', x: 1860, y: 560 },
  { kind: 'tuft', x: 2320, y: 940 },
  { kind: 'tuft', x: 2920, y: 760 },
  { kind: 'flower', x: 520, y: 980 },
  { kind: 'flower', x: 1260, y: 1280 },
  { kind: 'flower', x: 2140, y: 520 },
  { kind: 'flowerBlue', x: 980, y: 760 },
  { kind: 'flowerBlue', x: 1780, y: 1180 },
  { kind: 'flowerBlue', x: 2680, y: 1160 },
];

const POND_CANDIDATES: { x: number; y: number; variant: 'reeds' | 'stones' | 'lilies' }[] = [
  { x: 330, y: 270, variant: 'reeds' },
  { x: 1780, y: 1190, variant: 'stones' },
  { x: 2940, y: 650, variant: 'lilies' },
  { x: 420, y: 1460, variant: 'stones' },
  { x: 2250, y: 320, variant: 'reeds' },
  { x: 2580, y: 1320, variant: 'lilies' },
  { x: 1020, y: 1340, variant: 'reeds' },
];

const MEADOW_CANDIDATES: Point[] = [
  { x: 260, y: 520 },
  { x: 420, y: 1020 },
  { x: 620, y: 1250 },
  { x: 920, y: 340 },
  { x: 1040, y: 980 },
  { x: 1320, y: 1180 },
  { x: 1720, y: 280 },
  { x: 1840, y: 980 },
  { x: 2180, y: 760 },
  { x: 2500, y: 1360 },
  { x: 2880, y: 480 },
  { x: 3040, y: 1160 },
];

const DECOR_SPRITE = {
  tree: TREE,
  bush: BUSH,
  crops: CROPS,
  fence: FENCE,
  mushroom: MUSHROOM,
  stump: STUMP,
  rock: ROCK,
  tuft: TUFT,
  flower: FLOWER,
  flowerBlue: FLOWER_BLUE,
};

export function GrassPatches() {
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

export function VillageDecor({ cells = [] }: { cells?: Cell[] }) {
  const blockers = sceneryBlockers(cells);
  const ponds = pickPonds(blockers);

  return (
    <>
      <GrassDetail />
      <BorderForest />
      {ponds.map(pond => (
        <Pond key={`${pond.variant}:${pond.x}:${pond.y}`} x={pond.x} y={pond.y} variant={pond.variant} />
      ))}
      <MeadowPatches blockers={blockers} />
      <PicnicGrove x={760} y={2240} />
      <FlowerWalk x={2620} y={2260} />
      <WorkYard x={1180} y={2550} />
      <Greenery blockers={blockers} />
    </>
  );
}

function Greenery({ blockers }: { blockers: Blocker[] }) {
  const used: Blocker[] = [];
  const decor = DECOR.map((item, index) => safeDecorItem(item, index, blockers, used)).filter(item => item !== null);

  return (
    <>
      {decor.map((d, i) => {
        const scale =
          d.kind === 'tree'
            ? 5
            : d.kind === 'crops'
              ? 6
              : d.kind === 'mushroom' || d.kind === 'tuft' || d.kind === 'flower' || d.kind === 'flowerBlue'
                ? 3
                : 4;
        return (
          <Placed key={`${d.kind}:${d.x}:${d.y}:${i}`} x={d.x} y={d.y} className="pixel pointer-events-none opacity-90">
            <Sprite of={DECOR_SPRITE[d.kind]} scale={scale} />
          </Placed>
        );
      })}
    </>
  );
}

function MeadowPatches({ blockers }: { blockers: Blocker[] }) {
  const used: Blocker[] = [];
  const meadows = MEADOW_CANDIDATES.filter(point => {
    if (!isSafe(point, 120, blockers, used)) return false;
    used.push({ ...point, radius: 150 });
    return true;
  }).slice(0, 7);

  return (
    <>
      {meadows.map((meadow, i) => (
        <span
          key={`${meadow.x}:${meadow.y}`}
          aria-hidden
          className="pixel pointer-events-none absolute"
          style={{ left: `${meadow.x - 80}px`, top: `${meadow.y - 52}px` }}
        >
          <span className="absolute top-0 left-8 h-8 w-28 bg-[#2f6a3b]" />
          <span className="absolute top-8 left-0 h-12 w-44 bg-[#2f6a3b]" />
          <span className="absolute top-20 left-10 h-8 w-28 bg-[#2f6a3b]" />
          <span className="absolute top-8 left-12 h-8 w-20 bg-[#3f8150]" />
          <span className="absolute top-14 left-26 h-6 w-8 bg-[#244f30]" />
          <span className="absolute top-12 left-8 h-2 w-2 bg-[#e4c05a]" />
          <span className="absolute top-28 left-28 h-2 w-2 bg-[#f0e6d2]" />
          <span className="absolute top-24 left-4">
            <Sprite of={i % 2 === 0 ? BUSH : TUFT} scale={4} />
          </span>
          <span className="absolute -top-8 left-30">
            <Sprite of={TREE} scale={4} />
          </span>
        </span>
      ))}
    </>
  );
}

function sceneryBlockers(cells: Cell[]): Blocker[] {
  if (cells.length === 0) return [];
  const { paths, parks } = roadLayoutFor(cells);
  const roadBlocks = paths.flatMap(path => segmentSamples(path.from, path.to).map(point => ({ ...point, radius: 92 })));
  const parkBlocks = parks.map(park => ({ x: park.x, y: park.y, radius: park.size * 1.25 }));
  const houseBlocks = cells
    .filter(c => !c.hidden)
    .map(cell => ({ x: cell.x, y: cell.y, radius: cell.kind === 'main' ? 160 : 120 }));
  return [...roadBlocks, ...parkBlocks, ...houseBlocks];
}

function segmentSamples(from: Point, to: Point): Point[] {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const count = Math.max(2, Math.ceil(length / 160));
  return Array.from({ length: count + 1 }, (_, i) => {
    const t = i / count;
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
  });
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isSafe(point: Point, radius: number, blockers: Blocker[], used: Blocker[]): boolean {
  if (point.x < 110 || point.x > WORLD_W - 110 || point.y < 110 || point.y > WORLD_H - 110) return false;
  if (blockers.some(blocker => distance(point, blocker) < radius + blocker.radius)) return false;
  return !used.some(blocker => distance(point, blocker) < radius + blocker.radius);
}

function safeDecorItem(item: DecorItem, index: number, blockers: Blocker[], used: Blocker[]): DecorItem | null {
  const radius =
    item.kind === 'tree'
      ? 86
      : item.kind === 'crops' || item.kind === 'fence'
        ? 72
        : item.kind === 'tuft' || item.kind === 'flower' || item.kind === 'flowerBlue' || item.kind === 'mushroom'
          ? 30
          : 48;
  const original = { x: item.x, y: item.y };
  if (isSafe(original, radius, blockers, used)) {
    used.push({ ...original, radius });
    return item;
  }

  const candidates = SAFE_DECOR.filter(candidate => candidate.kind === item.kind || item.kind === 'tree');
  for (let offset = 0; offset < candidates.length; offset++) {
    const candidate = candidates[(index + offset) % candidates.length];
    if (!isSafe(candidate, radius, blockers, used)) continue;
    used.push({ x: candidate.x, y: candidate.y, radius });
    return { ...item, x: candidate.x, y: candidate.y };
  }

  return null;
}

function pickPonds(blockers: Blocker[]): { x: number; y: number; variant: 'reeds' | 'stones' | 'lilies' }[] {
  const used: Blocker[] = [];
  const ponds: { x: number; y: number; variant: 'reeds' | 'stones' | 'lilies' }[] = [];
  for (const variant of ['reeds', 'stones', 'lilies'] as const) {
    const candidate = POND_CANDIDATES.find(pond => pond.variant === variant && isSafe(pond, 170, blockers, used));
    if (!candidate) continue;
    used.push({ x: candidate.x, y: candidate.y, radius: 210 });
    ponds.push(candidate);
  }
  return ponds;
}

function Pond({ x, y, variant }: { x: number; y: number; variant: 'reeds' | 'stones' | 'lilies' }) {
  const details =
    variant === 'reeds'
      ? [
          { of: REEDS, x: -95, y: -26, scale: 4 },
          { of: REEDS, x: 82, y: 42, scale: 4 },
          { of: LILY_PAD, x: 18, y: -8, scale: 3 },
        ]
      : variant === 'stones'
        ? [
            { of: PEBBLES, x: -78, y: 58, scale: 4 },
            { of: ROCK, x: 96, y: 20, scale: 3 },
            { of: LILY_PAD, x: -12, y: -2, scale: 3 },
          ]
        : [
            { of: LILY_PAD, x: -52, y: -6, scale: 4 },
            { of: LILY_PAD, x: 54, y: 18, scale: 3 },
            { of: REEDS, x: 96, y: -34, scale: 4 },
          ];

  return (
    <Placed x={x} y={y} className="pixel pointer-events-none">
      <span
        aria-hidden
        className="absolute -top-10 -left-24 h-6 w-30 bg-[#315c38] opacity-80"
        style={{ boxShadow: '24px -12px 0 #376842, 84px 0 0 #376842, 144px 18px 0 #315c38' }}
      />
      <Sprite of={POND} scale={8} />
      {details.map((detail, i) => (
        <span key={i} className="absolute" style={{ left: `${detail.x}px`, top: `${detail.y}px` }}>
          <Sprite of={detail.of} scale={detail.scale} />
        </span>
      ))}
    </Placed>
  );
}

function PicnicGrove({ x, y }: { x: number; y: number }) {
  return (
    <Placed x={x} y={y} className="pixel pointer-events-none">
      <span className="absolute -top-20 -left-28">
        <Sprite of={TREE} scale={6} />
      </span>
      <span className="absolute -top-10 left-16">
        <Sprite of={TREE} scale={5} />
      </span>
      <span className="absolute top-32 -left-16">
        <Sprite of={BUSH} scale={5} />
      </span>
      <span className="absolute top-12 left-10 h-12 w-20 border-4 border-[#6b4223] bg-[#b8564f]" />
      <span className="absolute top-16 left-14 h-4 w-12 bg-[#f0ead8]" />
    </Placed>
  );
}

function FlowerWalk({ x, y }: { x: number; y: number }) {
  return (
    <Placed x={x} y={y} className="pixel pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className="absolute" style={{ left: `${(i % 6) * 28}px`, top: `${Math.floor(i / 6) * 34}px` }}>
          <Sprite of={i % 2 === 0 ? FLOWER : FLOWER_BLUE} scale={4} />
        </span>
      ))}
      <span className="absolute top-24 left-36">
        <Sprite of={FENCE} scale={5} />
      </span>
    </Placed>
  );
}

function WorkYard({ x, y }: { x: number; y: number }) {
  return (
    <Placed x={x} y={y} className="pixel pointer-events-none">
      <span className="absolute -top-12 -left-16">
        <Sprite of={STUMP} scale={5} />
      </span>
      <span className="absolute -top-4 left-28">
        <Sprite of={ROCK} scale={4} />
      </span>
      <span className="absolute top-28 -left-28">
        <Sprite of={MUSHROOM} scale={4} />
      </span>
      <span className="absolute top-20 left-14">
        <Sprite of={FENCE} scale={5} />
      </span>
    </Placed>
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
        <Placed key={i} x={t.x} y={t.y} className="pixel pointer-events-none">
          <Sprite of={TREE} scale={i % 3 === 0 ? 6 : 5} />
        </Placed>
      ))}
    </>
  );
}

const DETAIL = Math.round((WORLD_W * WORLD_H) / 20000);

function GrassDetail() {
  return (
    <>
      {Array.from({ length: DETAIL }).map((_, i) => {
        const x = ((i * 397 + 131) % (WORLD_W - 60)) + 30;
        const y = ((i * 683 + 71) % (WORLD_H - 60)) + 30;
        const sprite = i % 9 === 0 ? FLOWER : i % 9 === 4 ? FLOWER_BLUE : i % 9 === 7 ? PEBBLES : TUFT;
        return (
          <Placed key={i} x={x} y={y} anchor="top-left" className="pixel pointer-events-none opacity-80">
            <Sprite of={sprite} scale={3} />
          </Placed>
        );
      })}
    </>
  );
}
