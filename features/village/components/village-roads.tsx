'use client';

import { WORLD_H, WORLD_W, type Cell } from '@/features/village/village-model';

export function VillageRoads({ cells }: { cells: Cell[] }) {
  const main = cells.find(c => c.kind === 'main');
  if (!main) return null;
  return (
    <svg aria-hidden className="absolute inset-0" style={{ width: WORLD_W, height: WORLD_H }}>
      {cells
        .filter(c => c.id !== main.id)
        .map(c => (
          <line
            key={c.id}
            x1={main.x}
            y1={main.y}
            x2={c.x}
            y2={c.y}
            stroke="#6e5638"
            strokeWidth="7"
            strokeDasharray="2 13"
            strokeLinecap="round"
          />
        ))}
    </svg>
  );
}
