// Hand-drawn pixel-art sprites rendered as SVG rect grids — no assets, crisp at any scale.

type Palette = Record<string, string>;

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

const WOOD = '#8a5a33';
const WOOD_D = '#6b4223';
const LEAF = '#4e9a4e';
const LEAF_D = '#2f7a3c';

// The furniture catalog — what commits build. Picked deterministically per commit.
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

export const RUG = {
  name: 'rug',
  palette: { r: '#a8574f', d: '#8a453e', y: '#e4c05a' },
  art: ['.rrrrrrrrrr.', 'rdyyyyyyyydr', 'rdyddddddydr', 'rdyyyyyyyydr', '.rrrrrrrrrr.'],
};

export function furnitureByName(name: string): (typeof FURNITURE)[number] | null {
  return FURNITURE.find(f => f.name === name) ?? null;
}

// The legend AI-drawn furniture uses — one letter per color, '.' transparent.
// Must match ART_LETTERS in room-ai.ts.
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
};

// Night version of any palette: every tone pulled toward a cold dark blue.
// Warm lit windows are handled by the caller (skip list), not here.
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
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return FURNITURE[(h >>> 0) % FURNITURE.length];
}

// Overworld greenery.
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

// Event-kind badges — tiny pixel glyphs instead of emoji.
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

// ── The village tileset: outlined, 3-tone-shaded sprites ────────────────────

// A PR's house at a glance: finished cottage = ready, studs + tarp = draft,
// extra storeys = the stack, topped by an attic with a dormer window.
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
    '...............OCCO...',
    '...............OCcO...',
    '......OOOOOOOOOOCCOO..',
    '....OORRRRRRRRROCCORO.',
    '...ORRRROOOOOORRRRRRO.',
    '..ORRRRROqqqqORRRRRRO.',
    '.ORRRRRROqqqqORRRRRRO.',
    'ORRRRRRROOOOOORRRRRRRO',
    'OSSSSSSSSSSSSSSSSSSSSO',
  ];
  const roof = floors > 1 ? atticRoof : plainRoof;
  // Draft: no roof yet — ridge beam, a half-pulled tarp, scaffold walkway.
  const constructionTop = [
    '.p...................p',
    '.p.ObbbbbbbbbbbbbbO..p',
    '.pObTTTTTTTTTbbbbbbO.p',
    '.pObTTTTTTTTTTbbbbbOpp',
    'pppppppppppppppppppppp',
  ];
  const upperFloor = [
    '.OWWWWWWWWWWWWWWWWWWO.',
    '.OWqqWWqqWWWWqqWWqqWO.',
    '.OWqqWWqqWWWWqqWWqqWO.',
    '.OWwWWWWWWwWWWWWWWwWO.',
    '.OwwwwwwwwwwwwwwwwwwO.',
  ];
  // Finished ground floor: framed windows, flower boxes, a proper door with a step.
  const readyGround = [
    '.OWWWWWWWWWWWWWWWWWWO.',
    '.OWqqWWWWWWWWWWWWqqWO.',
    '.OWqqWWWWDDDWWWWWqqWO.',
    '.OWFfFWWWDDDWWWWFfFWO.',
    '.OWwWWWWWDDdWWWWWWwWO.',
    '.OWWWWWWWDDDWWWWWWWWO.',
    '.OOOOOOOODDDOOOOOOOOO.',
  ];
  // Draft ground floor: unpainted studs, a doorless opening, planks piled outside.
  const draftGround = [
    '.OWbWWbWWWWWWWbWWbWWO.',
    '.OWbWWbWWmmmWWbWWbWWO.',
    '.OWbWWbWWmmmWWbWWbWWO.',
    '.OWbWWbWWmmmWWbWWbWWO.',
    '.kkkWWbWWmmmWWbWWbWWO.',
    'kkkkkOOOOmmmOOOOOOOOO.',
  ];
  const mid = Array.from({ length: Math.max(0, Math.min(3, floors - 1)) }, () => upperFloor).flat();
  return draft ? [...constructionTop, ...mid, ...draftGround] : [...roof, ...mid, ...readyGround];
}

// A branch is a little log cabin — work happening off the beaten path.
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

// Issues camp out in tents — conversations pitched on the green, not construction.
export function tentArt(): string[] {
  return [
    '.......OO.......',
    '......ORRO......',
    '.....ORRRRO.....',
    '....ORSRRSRO....',
    '...ORRSRRSRRO...',
    '..ORRRSmmSRRRO..',
    '.ORRRRSmmSRRRRO.',
    'OOOOOOOmmOOOOOOO',
  ];
}

// The town hall: clock tower, banners, double doors — the village landmark.
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
    // construction + trim letters
    C: '#8d939c', // chimney stone
    c: '#6b7078',
    b: '#6b4223', // exposed beams / studs
    T: '#4a76a8', // tarp
    p: '#a5814e', // scaffold poles + walkway
    m: '#241c12', // doorless opening
    k: '#8a5a33', // plank pile
    F: '#c85b5b', // window-box flowers
    f: '#3f7a44', // window-box leaves
  };
}

// Streetlamps line the roads; `q` swaps warm/dark so night can light them up.
export function lampArt(): string[] {
  return [
    '..OOO..',
    '.OqqqO.',
    '.OqqqO.',
    '..OOO..',
    '...O...',
    '...O...',
    '...O...',
    '...O...',
    '...O...',
    '..OOO..',
  ];
}

export function lampPalette(lit: boolean) {
  return { O: '#2e2418', q: lit ? '#ffd76a' : '#c9cdd4' };
}

export const WELL = {
  palette: { O: '#2e2418', R: '#8a4a2b', r: '#6e3a20', G: '#9aa0a8', g: '#7b8188', b: '#2b4d75', h: '#4a76a8', P: '#6b4223', y: '#e4c05a' },
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

// Interior fixtures.
export const WINDOW = {
  palette: { O: '#5a4632', b: '#bfe0f5', n: '#1a2c55' },
  art: ['OOOOOOOO', 'ObbbObbO', 'ObbbObbO', 'OOOOOOOO', 'ObbbObbO', 'ObbbObbO', 'OOOOOOOO'],
};

export const CAMPFIRE = {
  palette: { O: '#2e2418', y: '#ffd76a', o: '#e0862f', r: '#c85b5b', w: '#6b4223', g: '#8d939c' },
  art: [
    '....y....',
    '...yoy...',
    '..yooor..',
    '..rooor..',
    '.rrooorr.',
    '.wwrwrww.',
    'wwOwwwOww',
    '.g.....g.',
  ],
};

export const LOG_SEAT = {
  palette: { W: '#8a5a33', w: '#6b4223', O: '#2e2418' },
  art: ['OWWWWWWWWO', 'WwWWwwWWwW', 'OWWWWWWWWO'],
};
