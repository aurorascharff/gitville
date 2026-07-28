import { WORLD_H, WORLD_W, type Cell } from '@/features/village/utils/village-model';

const FOOT = 46;
const JUNCTION_MIN = 120;
const JUNCTION_MAX = 260;
const MAIN_LANE_COUNT = 4;

function fixed(n: number): number {
  return Math.round(n * 100) / 100;
}

function svg(n: number): string {
  return fixed(n).toString();
}

function fixedPoint(point: Point): Point {
  return { x: fixed(point.x), y: fixed(point.y) };
}

export type Point = {
  x: number;
  y: number;
};

type RoadNode = Pick<Cell, 'id' | 'kind' | 'label' | 'ref' | 'baseRef' | 'conflict'> & {
  x: number;
  y: number;
};

type RoadPath = {
  id: string;
  d: string;
  from: Point;
  to: Point;
  weight: number;
  construction: boolean;
};

export type RoadPark = {
  id: string;
  x: number;
  y: number;
  size: number;
};

export type RoadLayout = {
  paths: RoadPath[];
  parks: RoadPark[];
};

function foot(cell: Cell): RoadNode {
  return {
    id: cell.id,
    kind: cell.kind,
    label: cell.label,
    ref: cell.ref,
    baseRef: cell.baseRef,
    conflict: cell.conflict,
    x: cell.x,
    y: cell.y + FOOT,
  };
}

function curve(from: Point, to: Point): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const bend = Math.min(90, Math.hypot(dx, dy) * 0.22);
  const sway = dx === 0 ? 0 : Math.sign(dx) * bend;
  return `M ${svg(from.x)} ${svg(from.y)} C ${svg(from.x + sway)} ${svg(from.y + dy * 0.42)}, ${svg(to.x - sway)} ${svg(to.y - dy * 0.42)}, ${svg(to.x)} ${svg(to.y)}`;
}

function roadPath(id: string, from: Point, to: Point, weight: number, construction = false): RoadPath {
  const stableFrom = fixedPoint(from);
  const stableTo = fixedPoint(to);
  return { id, from: stableFrom, to: stableTo, weight, construction, d: curve(stableFrom, stableTo) };
}

function junctionFor(target: Point, children: RoadNode[]): Point {
  const centroid = children.reduce(
    (sum, child) => ({ x: sum.x + child.x / children.length, y: sum.y + child.y / children.length }),
    { x: 0, y: 0 },
  );
  const dx = centroid.x - target.x;
  const dy = centroid.y - target.y;
  const distance = Math.hypot(dx, dy) || 1;
  const offset = Math.min(JUNCTION_MAX, Math.max(JUNCTION_MIN, distance * 0.42));

  return fixedPoint({
    x: target.x + (dx / distance) * offset,
    y: target.y + (dy / distance) * offset,
  });
}

function mainLaneFor(child: RoadNode, main: RoadNode): number {
  const angle = Math.atan2(child.y - main.y, child.x - main.x);
  const normalized = angle < 0 ? angle + Math.PI * 2 : angle;
  return Math.floor((normalized / (Math.PI * 2)) * MAIN_LANE_COUNT) % MAIN_LANE_COUNT;
}

function visibleUpstreamFor(cell: RoadNode, nodes: RoadNode[], main: RoadNode): RoadNode | null {
  if (!cell.baseRef || cell.baseRef === main.label) return null;
  return nodes.find(node => node.kind === 'pr' && node.ref === cell.baseRef) ?? null;
}

function parkSize(count: number): number {
  return Math.min(92, 36 + count * 9);
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function sameEndpoint(a: RoadPath, b: RoadPath): boolean {
  return (
    distance(a.from, b.from) < 36 ||
    distance(a.from, b.to) < 36 ||
    distance(a.to, b.from) < 36 ||
    distance(a.to, b.to) < 36
  );
}

function segmentIntersection(a: RoadPath, b: RoadPath): Point | null {
  const ax = a.to.x - a.from.x;
  const ay = a.to.y - a.from.y;
  const bx = b.to.x - b.from.x;
  const by = b.to.y - b.from.y;
  const cross = ax * by - ay * bx;
  if (Math.abs(cross) < 0.001) return null;

  const cx = b.from.x - a.from.x;
  const cy = b.from.y - a.from.y;
  const t = (cx * by - cy * bx) / cross;
  const u = (cx * ay - cy * ax) / cross;
  if (t <= 0.12 || t >= 0.88 || u <= 0.12 || u >= 0.88) return null;

  return fixedPoint({ x: a.from.x + ax * t, y: a.from.y + ay * t });
}

function closestPointOnSegment(point: Point, path: RoadPath): Point {
  const dx = path.to.x - path.from.x;
  const dy = path.to.y - path.from.y;
  const len = dx * dx + dy * dy;
  if (len === 0) return path.from;
  const t = Math.max(0.14, Math.min(0.86, ((point.x - path.from.x) * dx + (point.y - path.from.y) * dy) / len));
  return fixedPoint({ x: path.from.x + dx * t, y: path.from.y + dy * t });
}

function segmentNearPoint(a: RoadPath, b: RoadPath): Point | null {
  const pairs = [
    [closestPointOnSegment(a.from, b), a.from],
    [closestPointOnSegment(a.to, b), a.to],
    [closestPointOnSegment(b.from, a), b.from],
    [closestPointOnSegment(b.to, a), b.to],
  ] as [Point, Point][];
  const hit = pairs.find(([p, q]) => distance(p, q) < 46);
  return hit ? fixedPoint({ x: (hit[0].x + hit[1].x) / 2, y: (hit[0].y + hit[1].y) / 2 }) : null;
}

function overlapParks(paths: RoadPath[]): RoadPark[] {
  const parks: RoadPark[] = [];
  for (let i = 0; i < paths.length; i++) {
    for (let j = i + 1; j < paths.length; j++) {
      if (sameEndpoint(paths[i], paths[j])) continue;
      const point = segmentIntersection(paths[i], paths[j]) ?? segmentNearPoint(paths[i], paths[j]);
      if (point) parks.push({ id: `overlap:${paths[i].id}:${paths[j].id}`, x: point.x, y: point.y, size: 52 });
    }
  }
  return parks;
}

function mergeParks(parks: RoadPark[]): RoadPark[] {
  const merged: RoadPark[] = [];
  for (const park of parks) {
    const existing = merged.find(other => distance(park, other) < (park.size + other.size) * 0.78);
    if (!existing) {
      merged.push({ ...park });
      continue;
    }

    const total = existing.size + park.size;
    existing.x = fixed((existing.x * existing.size + park.x * park.size) / total);
    existing.y = fixed((existing.y * existing.size + park.y * park.size) / total);
    existing.size = fixed(Math.min(126, Math.max(existing.size, park.size) + Math.min(18, park.size * 0.28)));
  }
  return merged;
}

function octagonPoints(cx: number, cy: number, r: number): string {
  const inset = r * 0.42;
  return [
    [cx - inset, cy - r],
    [cx + inset, cy - r],
    [cx + r, cy - inset],
    [cx + r, cy + inset],
    [cx + inset, cy + r],
    [cx - inset, cy + r],
    [cx - r, cy + inset],
    [cx - r, cy - inset],
  ]
    .map(([x, y]) => `${svg(x)},${svg(y)}`)
    .join(' ');
}

function JunctionRoundabout({ park, index }: { park: RoadPark; index: number }) {
  const outer = fixed(Math.max(28, Math.min(48, park.size * 0.42)));
  const road = fixed(outer * 0.76);
  const green = fixed(outer * 0.42);
  const flowerX = park.x + (index % 2 === 0 ? -green * 0.25 : green * 0.18);
  const flowerY = park.y + (index % 3 === 0 ? -green * 0.12 : green * 0.2);

  return (
    <g>
      <polygon points={octagonPoints(park.x, park.y, outer)} fill="#6e5638" opacity="0.9" />
      <polygon points={octagonPoints(park.x, park.y, road)} fill="#a5814e" />
      <polygon points={octagonPoints(park.x, park.y, green)} fill="#2f6a3b" />
      <rect
        x={svg(park.x - green * 0.22)}
        y={svg(park.y - green * 0.18)}
        width={svg(green * 0.44)}
        height={svg(green * 0.36)}
        fill="#3f8150"
      />
      <rect
        x={svg(flowerX)}
        y={svg(flowerY)}
        width={svg(Math.max(3, green * 0.14))}
        height={svg(Math.max(3, green * 0.14))}
        fill="#e4c05a"
      />
      <rect
        x={svg(park.x + green * 0.22)}
        y={svg(park.y - green * 0.08)}
        width={svg(Math.max(3, green * 0.12))}
        height={svg(Math.max(3, green * 0.12))}
        fill="#f0e6d2"
      />
    </g>
  );
}

function Roadwork({ path, index }: { path: RoadPath; index: number }) {
  const mx = (path.from.x + path.to.x) / 2;
  const my = (path.from.y + path.to.y) / 2;
  const angle = (Math.atan2(path.to.y - path.from.y, path.to.x - path.from.x) * 180) / Math.PI;

  return (
    <g>
      <path d={path.d} fill="none" stroke="#d88735" strokeWidth={10} strokeDasharray="18 18" strokeLinecap="round" />
      <g transform={`translate(${svg(mx)} ${svg(my)}) rotate(${svg(angle)})`}>
        <rect x={-24} y={-16} width={48} height={12} fill="#4a3826" />
        <rect x={-20} y={-13} width={9} height={6} fill="#e4c05a" />
        <rect x={-5} y={-13} width={9} height={6} fill="#e07a3f" />
        <rect x={10} y={-13} width={9} height={6} fill="#e4c05a" />
        <rect x={-18 + (index % 3) * 16} y={4} width={10} height={10} fill="#e07a3f" />
      </g>
    </g>
  );
}

function roadClusters(origin: Point, children: RoadNode[]): RoadNode[][] {
  const clusters = Math.min(3, Math.max(2, Math.ceil(children.length / 3)));
  const sorted = children
    .slice()
    .sort((a, b) => Math.atan2(a.y - origin.y, a.x - origin.x) - Math.atan2(b.y - origin.y, b.x - origin.x));
  return Array.from({ length: clusters }, (_, i) =>
    sorted.slice(Math.floor((i * sorted.length) / clusters), Math.floor(((i + 1) * sorted.length) / clusters)),
  ).filter(group => group.length > 0);
}

function appendRoadBranch(paths: RoadPath[], parks: RoadPark[], origin: Point, children: RoadNode[], id: string) {
  if (children.length <= 3) {
    const target = children.length === 1 ? origin : junctionFor(origin, children);
    if (children.length > 1) paths.push(roadPath(`${id}:junction`, origin, target, children.length));
    for (const child of children) paths.push(roadPath(`${id}:${child.id}`, target, child, 1, Boolean(child.conflict)));
    return;
  }

  const junction = junctionFor(origin, children);
  parks.push({ id: `${id}:park`, x: junction.x, y: junction.y, size: parkSize(children.length) });
  paths.push(roadPath(`${id}:junction`, origin, junction, children.length));

  for (const [index, cluster] of roadClusters(junction, children).entries()) {
    if (cluster.length === 1) {
      const [child] = cluster;
      paths.push(roadPath(`${id}:${child.id}`, junction, child, 1, Boolean(child.conflict)));
      continue;
    }

    const split = junctionFor(junction, cluster);
    if (cluster.length > 3)
      parks.push({ id: `${id}:split:${index}`, x: split.x, y: split.y, size: parkSize(cluster.length) });
    paths.push(roadPath(`${id}:split:${index}`, junction, split, cluster.length));
    for (const child of cluster)
      paths.push(roadPath(`${id}:${index}:${child.id}`, split, child, 1, Boolean(child.conflict)));
  }
}

function appendGroupedRoads(paths: RoadPath[], parks: RoadPark[], target: RoadNode, children: RoadNode[], id: string) {
  if (children.length === 1) {
    const [child] = children;
    paths.push(roadPath(`${id}:${child.id}`, target, child, 1, Boolean(child.conflict || target.conflict)));
    return;
  }

  appendRoadBranch(paths, parks, target, children, id);
}

export function roadLayoutFor(cells: Cell[]): RoadLayout {
  const nodes = cells.filter(c => !c.hidden).map(foot);
  const main = nodes.find(n => n.kind === 'main');
  if (!main) return { paths: [], parks: [] };

  const inbox = nodes.find(n => n.kind === 'inbox');
  const upstreamGroups = new Map<string, { target: RoadNode; children: RoadNode[] }>();
  const mainGroups = new Map<number, RoadNode[]>();

  for (const node of nodes) {
    if (node.kind !== 'pr') continue;

    const upstream = visibleUpstreamFor(node, nodes, main);
    if (upstream) {
      const group = upstreamGroups.get(upstream.id) ?? { target: upstream, children: [] };
      group.children.push(node);
      upstreamGroups.set(upstream.id, group);
      continue;
    }

    const lane = mainLaneFor(node, main);
    mainGroups.set(lane, [...(mainGroups.get(lane) ?? []), node]);
  }

  const paths: RoadPath[] = inbox ? [roadPath('main:inbox', main, inbox, 1)] : [];
  const parks: RoadPark[] = [];
  for (const [lane, children] of mainGroups) appendGroupedRoads(paths, parks, main, children, `main:lane:${lane}`);
  for (const { target, children } of upstreamGroups.values())
    appendGroupedRoads(paths, parks, target, children, target.id);

  return { paths, parks: mergeParks([...parks, ...overlapParks(paths)]) };
}

function roadLampCandidates(path: RoadPath, index: number): Point[] {
  const dx = path.to.x - path.from.x;
  const dy = path.to.y - path.from.y;
  const length = Math.hypot(dx, dy);
  if (length < 190) return [];

  const nx = -dy / length;
  const ny = dx / length;
  const side = index % 2 === 0 ? 1 : -1;
  const offset = path.weight > 2 ? 58 : 44;
  const stops = length > 520 ? [0.34, 0.66] : [0.52];

  return stops.map((t, stopIndex) =>
    fixedPoint({
      x: path.from.x + dx * t + nx * offset * (stopIndex % 2 === 0 ? side : -side),
      y: path.from.y + dy * t + ny * offset * (stopIndex % 2 === 0 ? side : -side),
    }),
  );
}

export function roadLampSpots(cells: Cell[]): Point[] {
  const { paths, parks } = roadLayoutFor(cells);
  const spots: Point[] = [];
  const blocked = parks.map(park => ({ x: park.x, y: park.y, radius: park.size * 0.85 }));

  for (const [index, path] of paths.entries()) {
    for (const spot of roadLampCandidates(path, index)) {
      if (spot.x < 80 || spot.x > WORLD_W - 80 || spot.y < 80 || spot.y > WORLD_H - 80) continue;
      if (blocked.some(park => distance(spot, park) < park.radius)) continue;
      if (spots.some(existing => distance(existing, spot) < 150)) continue;
      spots.push(spot);
      if (spots.length >= 18) return spots;
    }
  }

  return spots;
}

export function VillageRoads({ cells }: { cells: Cell[] }) {
  const { paths, parks } = roadLayoutFor(cells);
  if (paths.length === 0) return null;

  const layers = [
    { stroke: '#6e5638', width: 22, opacity: 0.25, dash: undefined },
    { stroke: '#8f7448', width: 16, opacity: 0.85, dash: undefined },
    { stroke: '#a98d5c', width: 5, opacity: 1, dash: '3 15' },
  ];

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0"
      shapeRendering="crispEdges"
      style={{ width: WORLD_W, height: WORLD_H }}
    >
      <g>
        {parks.map((park, i) => (
          <JunctionRoundabout key={park.id} park={park} index={i} />
        ))}
      </g>
      {layers.map((l, li) => (
        <g key={li} stroke={l.stroke} strokeWidth={l.width} strokeLinecap="round" opacity={l.opacity}>
          {paths.map(path => (
            <path
              key={path.id}
              d={path.d}
              fill="none"
              strokeDasharray={l.dash}
              strokeWidth={l.width + Math.min(path.weight - 1, 6) * (li === 2 ? 0.8 : 2)}
            />
          ))}
        </g>
      ))}
      <g>
        {paths
          .filter(path => path.construction)
          .map((path, i) => (
            <Roadwork key={path.id} path={path} index={i} />
          ))}
      </g>
    </svg>
  );
}
