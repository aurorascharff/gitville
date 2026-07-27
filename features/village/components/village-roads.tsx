'use client';

import { WORLD_H, WORLD_W, type Cell } from '@/features/village/village-model';

// Village roads, not a starburst: a ring lane through the inner houses, short
// lanes from the outer houses to their nearest ring neighbor, and a small
// plaza path from the hall onto the ring. Corners bend at houses, like a town.
export function VillageRoads({ cells }: { cells: Cell[] }) {
  const main = cells.find(c => c.kind === 'main');
  if (!main) return null;

  const others = cells.filter(c => c.id !== main.id);
  // The honeycomb puts ring-1 houses ~1 slot from center, ring-2 ~2 slots out.
  const inner = others.filter(c => Math.hypot(c.x - main.x, c.y - main.y) < 480);
  const outer = others.filter(c => Math.hypot(c.x - main.x, c.y - main.y) >= 480);
  const byAngle = [...inner].sort((a, b) => Math.atan2(a.y - main.y, a.x - main.x) - Math.atan2(b.y - main.y, b.x - main.x));

  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  // Ring: connect inner houses in angular order, closing the loop.
  for (let i = 0; i < byAngle.length; i++) {
    const a = byAngle[i];
    const b = byAngle[(i + 1) % byAngle.length];
    if (byAngle.length < 2 || (byAngle.length === 2 && i === 1)) break;
    segments.push({ x1: a.x, y1: a.y + 30, x2: b.x, y2: b.y + 30 });
  }
  // Lanes: every outer house joins its nearest neighbor on (or toward) the ring.
  for (const c of outer) {
    const nearest = [...inner, main].sort(
      (a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y),
    )[0];
    if (nearest) segments.push({ x1: c.x, y1: c.y + 30, x2: nearest.x, y2: nearest.y + 30 });
  }
  // The hall joins the ring at its two nearest houses — a little plaza fork.
  for (const n of byAngle.slice().sort((a, b) => Math.hypot(a.x - main.x, a.y - main.y) - Math.hypot(b.x - main.x, b.y - main.y)).slice(0, 2)) {
    segments.push({ x1: main.x, y1: main.y + 44, x2: n.x, y2: n.y + 30 });
  }

  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0" style={{ width: WORLD_W, height: WORLD_H }}>
      {segments.map((s, i) => (
        <line key={`edge-${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#6e5638" strokeWidth="20" strokeLinecap="round" opacity="0.25" />
      ))}
      {segments.map((s, i) => (
        <line key={`bed-${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#8f7448" strokeWidth="16" strokeLinecap="round" opacity="0.85" />
      ))}
      {segments.map((s, i) => (
        <line key={`stone-${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#a98d5c" strokeWidth="5" strokeDasharray="3 15" strokeLinecap="round" />
      ))}
    </svg>
  );
}
