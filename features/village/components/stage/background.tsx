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
import { WORLD_H, WORLD_W } from '@/features/village/utils/village-model';

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
      <Pond x={330} y={270} variant="reeds" />
      <Pond x={1780} y={1190} variant="stones" />
      <Pond x={2940} y={650} variant="lilies" />
      <PicnicGrove x={760} y={2240} />
      <FlowerWalk x={2620} y={2260} />
      <WorkYard x={1180} y={2550} />
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
        <span key={i} className="absolute" style={{ left: detail.x, top: detail.y }}>
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
        <span key={i} className="absolute" style={{ left: (i % 6) * 28, top: Math.floor(i / 6) * 34 }}>
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
