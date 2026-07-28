import { WORLD_H, WORLD_W, type Cell } from '@/features/village/utils/village-model';

const STEP = 380;
const FOOT = 46;

export function VillageRoads({ cells }: { cells: Cell[] }) {
  const nodes = cells.filter(c => !c.hidden).map(c => ({ x: c.x, y: c.y + FOOT }));
  if (nodes.length < 2) return null;

  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      if (dx * dx + dy * dy <= STEP * STEP) {
        edges.push({ x1: nodes[i].x, y1: nodes[i].y, x2: nodes[j].x, y2: nodes[j].y });
      }
    }
  }

  const layers = [
    { stroke: '#6e5638', width: 22, opacity: 0.25, dash: undefined },
    { stroke: '#8f7448', width: 16, opacity: 0.85, dash: undefined },
    { stroke: '#a98d5c', width: 5, opacity: 1, dash: '3 15' },
  ];

  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0" style={{ width: WORLD_W, height: WORLD_H }}>
      {layers.map((l, li) => (
        <g key={li} stroke={l.stroke} strokeWidth={l.width} strokeLinecap="round" opacity={l.opacity}>
          {edges.map((e, i) => (
            <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} strokeDasharray={l.dash} />
          ))}
        </g>
      ))}
    </svg>
  );
}
