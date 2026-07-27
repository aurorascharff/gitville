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
