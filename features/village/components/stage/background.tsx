import {
  BUSH,
  CROPS,
  FENCE,
  FLOWER,
  FLOWER_BLUE,
  MUSHROOM,
  PEBBLES,
  POND,
  ROCK,
  Sprite,
  STUMP,
  TREE,
  TUFT,
} from '@/features/village/components/shared/pixel-sprite';
import { Placed } from '@/features/village/components/shared/placed';
import { WORLD_H, WORLD_W } from '@/features/village/village-model';

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

const DECOR_SPRITE = {
  tree: TREE,
  bush: BUSH,
  crops: CROPS,
  fence: FENCE,
  mushroom: MUSHROOM,
  stump: STUMP,
  rock: ROCK,
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

export function VillageDecor() {
  return (
    <>
      <GrassDetail />
      <BorderForest />
      <Pond x={330} y={270} />
      <Pond x={1780} y={1190} />
      <Greenery />
    </>
  );
}

function Greenery() {
  return (
    <>
      {DECOR.map((d, i) => {
        const scale = d.kind === 'tree' ? 5 : d.kind === 'crops' ? 6 : d.kind === 'mushroom' ? 3 : 4;
        return (
          <Placed key={i} x={d.x} y={d.y} className="pixel pointer-events-none opacity-90">
            <Sprite of={DECOR_SPRITE[d.kind]} scale={scale} />
          </Placed>
        );
      })}
    </>
  );
}

function Pond({ x, y }: { x: number; y: number }) {
  return (
    <Placed x={x} y={y} className="pixel pointer-events-none">
      <Sprite of={POND} scale={7} />
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
