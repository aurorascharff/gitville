import { hashString } from '@/lib/utils';
import type { ReactNode } from 'react';

export type Palette = Record<string, string>;

export const ROOF = {
  main: ['#3b6bff', '#2b4fc4'],
  pr: ['#c85b5b', '#9d4444'],
  branch: ['#b0532e', '#8a4023'],
  issue: ['#8a6a9d', '#6b5279'],
  inbox: ['#7d8590', '#5f656e'],
} as const;

export function PixelSprite({
  art,
  palette,
  scale = 3,
  className,
}: {
  art: string[];
  palette: Palette;
  scale?: number;
  className?: string;
}) {
  const h = art.length;
  const w = Math.max(...art.map(r => r.length));
  return (
    <svg
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {art.flatMap((row, y) =>
        [...row].map((ch, x) => {
          const fill = palette[ch];
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        }),
      )}
    </svg>
  );
}

export function Sprite({
  of,
  scale,
  className,
}: {
  of: { art: string[]; palette: Palette };
  scale?: number;
  className?: string;
}) {
  return <PixelSprite art={of.art} palette={of.palette} scale={scale} className={className} />;
}

export function DayNight({ day, night }: { day: ReactNode; night: ReactNode }) {
  return (
    <>
      <span className="block dark:hidden">{day}</span>
      <span className="hidden dark:block">{night}</span>
    </>
  );
}

const WOOD = '#8a5a33';
const WOOD_D = '#6b4223';
const LEAF = '#4e9a4e';
const LEAF_D = '#2f7a3c';

export const FURNITURE: { name: string; art: string[]; palette: Palette }[] = [
  {
    name: 'plant',
    palette: { l: LEAF, d: LEAF_D, p: '#b0623b', q: '#8a4a2b' },
    art: ['..ld..', '.dlld.', 'ldlldl', '.dlld.', '..pp..', '.pppp.', '.qqqq.'],
  },
  {
    name: 'desk',
    palette: { w: WOOD, d: WOOD_D, m: '#22262e', s: '#5b8bff' },
    art: ['..mmmm..', '..mssm..', '..mmmm..', 'wwwwwwww', 'wddddddw', 'w.d..d.w', 'w.d..d.w'],
  },
  {
    name: 'bookshelf',
    palette: { w: WOOD, d: WOOD_D, r: '#c85b5b', b: '#5b8bff', g: '#58a55c', y: '#e4c05a' },
    art: ['wwwwww', 'wrbgyw', 'wwwwww', 'wybrgw', 'wwwwww', 'wgyrbw', 'wddddw'],
  },
  {
    name: 'lamp',
    palette: { y: '#ffd76a', o: '#e0a92f', p: '#3a3f4a' },
    art: ['.yyyy.', 'yyyyyy', '.oyyo.', '..pp..', '..pp..', '..pp..', '.pppp.'],
  },
  {
    name: 'crate',
    palette: { w: WOOD, d: WOOD_D },
    art: ['wwwwww', 'wdwwdw', 'wwddww', 'wwddww', 'wdwwdw', 'wwwwww'],
  },
  {
    name: 'sofa',
    palette: { r: '#b8564f', d: '#93413c', w: WOOD_D },
    art: ['r.....r', 'rrrrrrr', 'rdddddr', 'rrrrrrr', 'w.....w'],
  },
  {
    name: 'coffee table',
    palette: { w: WOOD, d: WOOD_D, c: '#f0ead8', s: '#9aa2ad' },
    art: ['..cc..', '..cs..', 'wwwwww', 'wddddw', '.w..w.'],
  },
  {
    name: 'monitor rig',
    palette: { m: '#22262e', s: '#6ee7a0', p: '#3a3f4a' },
    art: ['mmmmmmm', 'mssssmm', 'mssssmm', 'mmmmmmm', '...p...', '..ppp..'],
  },
];

export function furnitureByName(name: string): (typeof FURNITURE)[number] | null {
  return FURNITURE.find(f => f.name === name) ?? null;
}

// Palette letters must match ART_LETTERS / AI_ART_PALETTE in room-ai.ts.
export const AI_ART_PALETTE: Palette = {
  O: '#2e2418',
  W: WOOD,
  w: WOOD_D,
  m: '#22262e',
  s: '#6ee7a0',
  b: '#5b8bff',
  r: '#c85b5b',
  y: '#e4c05a',
  g: '#58a55c',
  p: '#9a6ab8',
  c: '#f0ead8',
  o: '#e0862f',
  t: '#3aa8a0',
};

export function nightenPalette(palette: Palette, skip: string[] = []): Palette {
  const out: Palette = {};
  for (const [key, hex] of Object.entries(palette)) {
    out[key] = skip.includes(key) ? hex : mixHex(hex, '#141c38', 0.52);
  }
  return out;
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sa: number, sb: number) => Math.round(sa + (sb - sa) * t);
  const r = ch((pa >> 16) & 255, (pb >> 16) & 255);
  const g = ch((pa >> 8) & 255, (pb >> 8) & 255);
  const bl = ch(pa & 255, pb & 255);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
}

export function furnitureFor(seed: string): (typeof FURNITURE)[number] {
  return FURNITURE[hashString(seed) % FURNITURE.length];
}

export const TREE = {
  palette: { l: LEAF_D, e: '#3c8a48', t: WOOD_D },
  art: ['...e...', '..eee..', '.eelee.', '..eee..', '.elele.', 'eeleele', '...t...', '...t...'],
};
export const BUSH = {
  palette: { l: LEAF, d: LEAF_D },
  art: ['.lld.', 'lldll', 'dllld', '.ddd.'],
};
export const FENCE = {
  palette: { w: '#a5814e', d: '#7c5f38' },
  art: ['w..w..w', 'wwwwwww', 'w..w..w', 'd..d..d'],
};
export const CROPS = {
  palette: { s: '#6b4a2b', d: '#5a3d22', g: '#58a55c', l: '#7cc281' },
  art: ['gsgsgsg', 'sdsdsds', 'lslsgsl', 'sdsdsds', 'gsgslsg', 'sdsdsds'],
};
export const ROCK = {
  palette: { g: '#8d939c', d: '#6b7078' },
  art: ['.ggg.', 'gggdg', 'gddgg', '.ggg.'],
};

const BADGE: Record<string, { art: string[]; palette: Palette }> = {
  push: { palette: { g: '#9aa2ad', h: '#8a5a33' }, art: ['.gggg.', '.gggg.', '..hh..', '..hh..', '..hh..'] },
  pr_opened: {
    palette: { g: '#58a55c', w: '#f0ead8' },
    art: ['g....g', 'g.ww.g', 'g.ww.g', 'gggggg', '...g..', '...g..'],
  },
  pr_merged: { palette: { p: '#9a6ab8' }, art: ['p....p', 'p....p', '.pppp.', '...p..', '...p..'] },
  pr_closed: { palette: { r: '#c85b5b' }, art: ['r....r', '.r..r.', '..rr..', '.r..r.', 'r....r'] },
  review: { palette: { w: '#f0ead8', b: '#2b3d55' }, art: ['.wwww.', 'wwbbww', 'wbbbbw', 'wwbbww', '.wwww.'] },
  comment: { palette: { w: '#f0ead8', d: '#5a4632' }, art: ['wwwwww', 'wddddw', 'wwwwww', '.ww...', 'w.....'] },
  issue: { palette: { g: '#58a55c', d: '#2f5a35' }, art: ['.gggg.', 'g....g', 'g.dd.g', 'g....g', '.gggg.'] },
  release: { palette: { y: '#e4c05a', h: '#6b4223' }, art: ['hyyyy.', 'hyyyy.', 'hyy...', 'h.....', 'h.....'] },
  branch_created: { palette: { g: '#58a55c', d: '#2f7a3c' }, art: ['..g...', '.ggg..', '..d...', '..d...', '.ddd..'] },
  branch_deleted: { palette: { g: '#8d939c' }, art: ['g....g', '.g..g.', '..gg..', '.g..g.', 'g....g'] },
};

export function KindBadge({ kind, scale = 2 }: { kind: string; scale?: number }) {
  const b = BADGE[kind] ?? BADGE.push;
  return <PixelSprite art={b.art} palette={b.palette} scale={scale} className="pixel" />;
}

export function cottageArt(floors: number, draft: boolean): string[] {
  const plainRoof = [
    '...............OCCO...',
    '...............OCcO...',
    '......OOOOOOOOOOCCOO..',
    '....OORRRRRRRRROCCORO.',
    '...ORRRRRRRRRRRRRRRRO.',
    '..ORRRRRRRRRRRRRRRRRO.',
    '.ORRRRRRRRRRRRRRRRRRO.',
    'ORRRRRRRRRRRRRRRRRRRRO',
    'OSSSSSSSSSSSSSSSSSSSSO',
  ];
  const atticRoof = [
    '.........OOOO.........',
    '.......OORRRROO.......',
    '......ORROqqORRO......',
    '.....ORRROqqORRRO.....',
    '....ORRRRROORRRRRO....',
    '...OSSSSSSSSSSSSSSO...',
  ];
  const narrowTop = ['...OWWWWWWWWWWWWWWO...', '...OWqqWWWWWWWWqqWO...', '...OWqqWWWWWWWWqqWO...'];
  const ledge = ['.OOOOOOOOOOOOOOOOOOOO.'];
  const constructionTop = [
    '.p...................p',
    '.p.ObbbbbbbbbbbbbbO..p',
    '.pObTTTTTTTTTbbbbbbO.p',
    '.pObTTTTTTTTTTbbbbbOpp',
    'pppppppppppppppppppppp',
  ];
  const floorA = [
    '.OwwwwwwwwwwwwwwwwwwO.',
    '.OWWWWWWWWWWWWWWWWWWO.',
    '.OWqqWWqqWWWWqqWWqqWO.',
    '.OWqqWWqqWWWWqqWWqqWO.',
    '.OWffWWffWWWWffWWffWO.',
  ];
  const floorB = [
    '.OwwwwwwwwwwwwwwwwwwO.',
    '.OWWWWWWWWWWWWWWWWWWO.',
    '.OWbqqbWWbqqbWWbqqbWO.',
    '.OWbqqbWWbqqbWWbqqbWO.',
    '.OWWWWWWWWWWWWWWWWWWO.',
  ];
  const readyGround = [
    '.OWWWWWWWWWWWWWWWWWWO.',
    '.OWqqWWWWWWWWWWWWqqWO.',
    '.OWqqWWWWDDDWWWWWqqWO.',
    '.OWFfFWWWDDDWWWWFfFWO.',
    '.OWwWWWWWDDdWWWWWWwWO.',
    '.OWWWWWWWDDDWWWWWWWWO.',
    '.OOOOOOOODDDOOOOOOOOO.',
  ];
  const draftGround = [
    '.OWbWWbWWWWWWWbWWbWWO.',
    '.OWbWWbWWmmmWWbWWbWWO.',
    '.OWbWWbWWmmmWWbWWbWWO.',
    '.OWbWWbWWmmmWWbWWbWWO.',
    '.kkkWWbWWmmmWWbWWbWWO.',
    'kkkkkOOOOmmmOOOOOOOOO.',
  ];
  const middles = Math.max(0, Math.min(3, floors - 2));
  const mid = Array.from({ length: middles }, (_, i) => (i % 2 === 0 ? floorA : floorB)).flat();
  if (draft) return [...constructionTop, ...mid, ...(floors > 1 ? floorA : []), ...draftGround];
  if (floors === 1) return [...plainRoof, ...readyGround];
  return [...atticRoof, ...narrowTop, ...ledge, ...mid, ...readyGround];
}

export function cabinArt(): string[] {
  return [
    '.....OOOOOO.....',
    '...OORRRRRROO...',
    '..ORRRRRRRRRRO..',
    '.ORRRRRRRRRRRRO.',
    'OSSSSSSSSSSSSSSO',
    '.OwWWwWWwWWwWWO.',
    '.OwqqWWWWWWqqWO.',
    '.OwqqWWDDWWqqWO.',
    '.OwWWWWDdWWWWWO.',
    '.OwWWwWDDWwWWwO.',
    '.OOOOOODDOOOOOO.',
  ];
}

export function tentArt(): string[] {
  return [
    '...........OO...........',
    '..........ORRO..........',
    '.........ORRRRO.........',
    '........ORRRRRRO........',
    '.......ORRSRRSRRO.......',
    '......ORRRSRRSRRRO......',
    '.....ORRRRSRRSRRRRO.....',
    '....ORRRRRSRRSRRRRRO....',
    '...ORRRRRRSmmSRRRRRRO...',
    '..ORRRRRRRSmmSRRRRRRRO..',
    '.ORRRRRRRRSmmSRRRRRRRRO.',
    'OOOOOOOOOOOmmOOOOOOOOOOO',
  ];
}

export function hallArt(): string[] {
  return [
    '..............OOOOOOOO..............',
    '.............OORRRRRROO.............',
    '............ORRRRRRRRRRO............',
    '............OSSSSSSSSSSO............',
    '............OWWWWWWWWWWO............',
    '............OWWccccccWWO............',
    '............OWWccOcccWWO............',
    '............OWWcccOccWWO............',
    '............OWWccccccWWO............',
    '....OOOOOOOOOWWWWWWWWWWOOOOOOOOO....',
    '..OORRRRRRRRRRRRRRRRRRRRRRRRRRRROO..',
    '.ORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRO.',
    'OSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSO',
    '.OWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWO.',
    '.OWqqWWqqWWWBBWWWWWWWWBBWWWqqWWqqWO.',
    '.OWqqWWqqWWWBBWWWWWWWWBBWWWqqWWqqWO.',
    '.OWwWWWWWWWWBBWWWWWWWWBBWWWWWWWWwWO.',
    '.OWWWWWWWWWWWWDDDWWDDDWWWWWWWWWWWWO.',
    '.OWwWWWWWWWWWWDDDWWDDDWWWWWWWWWWwWO.',
    '.OWWWWWWWWWWWWDDdWWdDDWWWWWWWWWWWWO.',
    '.OOOOOOOOOOOOODDDOODDDOOOOOOOOOOOOO.',
  ];
}

export function housePalette(roof: string, roofShade: string, lit: boolean) {
  return {
    O: '#2e2418',
    R: roof,
    S: roofShade,
    W: '#d8b078',
    w: '#c39a5f',
    q: lit ? '#ffd76a' : '#3a3f4a',
    D: '#6b4630',
    d: '#e4c05a',
    B: '#3b6bff',
    C: '#8d939c',
    c: '#6b7078',
    b: '#6b4223',
    T: '#4a76a8',
    p: '#a5814e',
    m: '#241c12',
    k: '#8a5a33',
    F: '#c85b5b',
    f: '#3f7a44',
  };
}

export function lampArt(): string[] {
  return ['..OOO..', '.OqqqO.', '.OqqqO.', '..OOO..', '...O...', '...O...', '...O...', '...O...', '...O...', '..OOO..'];
}

export function lampPalette(lit: boolean) {
  return { O: '#2e2418', q: lit ? '#ffd76a' : '#c9cdd4' };
}

export const WELL = {
  palette: {
    O: '#2e2418',
    R: '#8a4a2b',
    r: '#6e3a20',
    G: '#9aa0a8',
    g: '#7b8188',
    b: '#2b4d75',
    h: '#4a76a8',
    P: '#6b4223',
    y: '#e4c05a',
  },
  art: [
    '.......OOOO.......',
    '.....OORRRROO.....',
    '...OORRRRRRRROO...',
    '..ORRRRRRRRRRRRO..',
    '.ORRRRrRRRRrRRRRO.',
    'OrrrrrrrrrrrrrrrrO',
    '..OP..........PO..',
    '..OP....y.....PO..',
    '..OP....P.....PO..',
    '.OGGGGGGGGGGGGGGO.',
    '.OGgbbhbbbbbhbbGO.',
    '.OGgbbbbhbbbbbbGO.',
    '.OGgbbbbbbbhbbbGO.',
    '.OgGGGGGGGGGGGGgO.',
    '..OOOOOOOOOOOOOO..',
  ],
};

export const POND = {
  palette: { O: '#23405c', b: '#2b5d8f', h: '#5a8fc0', d: '#254c73' },
  art: [
    '....OOOOOOOOOOOOOO....',
    '..OObbbbbbbbbbbbbbOO..',
    '.ObbbhhbbbbbbbbbbbbO.',
    'ObbbbbbbbbbbhhbbbbbbO',
    'ObbdbbbbbbbbbbbbbdbbO',
    '.ObbbbbbdbbbbbbbbbbO.',
    '..OObbbbbbbbbbbbOO..',
    '....OOOOOOOOOOOO....',
  ],
};

export const TUFT = {
  palette: { g: '#3f7a44' },
  art: ['g.g.g', '.g.g.'],
};

export const FLOWER = {
  palette: { w: '#f2ead8', y: '#e4c05a', g: '#3f7a44' },
  art: ['.w.', 'wyw', '.w.', '.g.'],
};

export const FLOWER_BLUE = {
  palette: { w: '#9db9e8', y: '#f2ead8', g: '#3f7a44' },
  art: ['.w.', 'wyw', '.w.', '.g.'],
};

export const PEBBLES = {
  palette: { g: '#87919c', d: '#6e7680' },
  art: ['gd.g', '.g.d'],
};

export const MUSHROOM = {
  palette: { r: '#c85b5b', w: '#f2ead8', s: '#d8c9a8' },
  art: ['.rrr.', 'rwrwr', '.sss.', '.ss..'],
};

export const STUMP = {
  palette: { W: '#a5814e', w: '#7c5f38', d: '#6b4223' },
  art: ['.WWWW.', 'WwWWwW', 'WWwwWW', 'dWWWWd', '.dddd.'],
};

export const FIREPLACE = {
  palette: { O: '#2e2418', G: '#9aa0a8', g: '#7b8188', m: '#241c12', y: '#ffd76a', o: '#e0862f', W: '#8a5a33' },
  art: [
    'OGGGGGGGGGGO',
    'OGgGGGGGGgGO',
    'OGGmmmmmmGGO',
    'OGGmmyymmGGO',
    'OGGmyooymGGO',
    'OGGmoyyomGGO',
    'OGGWWWWWWGGO',
    'OggggggggggO',
  ],
};

export const BARRIER = {
  palette: { y: '#e4c05a', d: '#3a2f22', O: '#2e2418' },
  art: ['yyddyydd', 'ddyyddyy', 'yyddyydd', '.O....O.', '.O....O.'],
};

export const CARPENTER = {
  palette: { h: '#6b4223', s: '#e8b98a', d: '#2a2d36', r: '#b8564f', a: '#e4c05a', m: '#9aa0a8', w: '#8a5a33' },
  art: [
    '....hhhh..mm',
    '...hssssh.mm',
    '...sddsss..w',
    '...ssssss..w',
    '..rrrrrrr..w',
    '.rraaaaarr.w',
    '.r.aaaaa.r..',
    '...aaaaa....',
    '...dd.dd....',
    '...dd.dd....',
  ],
};

export const WORKBENCH = {
  palette: { O: '#2e2418', W: '#8a5a33', w: '#6b4223', m: '#9aa0a8', y: '#e4c05a' },
  art: ['.m..........y.', 'OWWWWWWWWWWWWO', 'OWwWWwwwWWwWWO', 'OWWWWWWWWWWWWO', '.OW.........WO', '.OW.........WO'],
};

export const BARREL = {
  palette: { O: '#2e2418', W: '#8a5a33', w: '#6b4223', m: '#7b8188', b: '#4a76a8' },
  art: ['.OOOOOO.', 'OWbbbbWO', 'OmmmmmmO', 'OWwWWwWO', 'OWWwwWWO', 'OmmmmmmO', '.OWWWWO.', '..OOOO..'],
};

export const CHEST = {
  palette: { O: '#2e2418', W: '#8a5a33', w: '#6b4223', y: '#e4c05a' },
  art: ['.OOOOOOOO.', 'OWWWWWWWWO', 'OWwwwwwwWO', 'OOOOyyOOOO', 'OWWWyyWWWO', 'OWwwwwwwWO', 'OOOOOOOOOO'],
};

export const TABLE_LONG = {
  palette: { O: '#2e2418', W: '#8a5a33', w: '#6b4223', c: '#f0ead8', y: '#e4c05a' },
  art: [
    '.cc..yy..cc..yy..cc.',
    'OWWWWWWWWWWWWWWWWWWO',
    'OwwwwwwwwwwwwwwwwwwO',
    '.OW..............WO.',
    '.OW..............WO.',
  ],
};

export const WINDOW = {
  palette: { O: '#5a4632', b: '#bfe0f5', n: '#1a2c55' },
  art: ['OOOOOOOO', 'ObbbObbO', 'ObbbObbO', 'OOOOOOOO', 'ObbbObbO', 'ObbbObbO', 'OOOOOOOO'],
};

export const CAMPFIRE = {
  palette: { O: '#2e2418', y: '#ffd76a', o: '#e0862f', r: '#c85b5b', w: '#6b4223', g: '#8d939c' },
  art: ['....y....', '...yoy...', '..yooor..', '..rooor..', '.rrooorr.', '.wwrwrww.', 'wwOwwwOww', '.g.....g.'],
};

export const LOG_SEAT = {
  palette: { W: '#8a5a33', w: '#6b4223', O: '#2e2418' },
  art: ['OWWWWWWWWO', 'WwWWwwWWwW', 'OWWWWWWWWO'],
};
