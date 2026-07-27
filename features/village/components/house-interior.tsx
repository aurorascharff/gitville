'use client';

import { ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { RelativeTime } from '@/components/ui/relative-time';
import {
  AI_ART_PALETTE,
  BARREL,
  BARRIER,
  CAMPFIRE,
  CARPENTER,
  CHEST,
  FIREPLACE,
  furnitureByName,
  furnitureFor,
  KindBadge,
  LOG_SEAT,
  PixelSprite,
  TABLE_LONG,
  WELL,
  WINDOW,
  WORKBENCH,
} from '@/features/village/components/pixel-sprite';
import { PlayerSprite } from '@/features/village/components/player';
import { useRoomSpec, useTimeWindow, useVillageData, useWorldModel, type RoomSpecItem } from '@/features/village/use-village-data';
import { pickedPrs, roomFor, type Cell } from '@/features/village/village-model';
import { useVillageUi } from '@/features/village/village-ui-context';
import { cn } from '@/lib/utils';
import type { BranchCommit, WireEvent } from '@/types/github';

const WALL_H = 150;
const TILE = 56;

// Where in the building this room sits: the top of a stack is the attic, the
// bottom is the living room, and everything between is a plain storey.
type RoomRole = 'attic' | 'middle' | 'ground' | 'single';

function roomRole(cell: Cell): RoomRole {
  if (cell.kind !== 'pr') return 'single';
  if (!cell.hidden && (cell.floors ?? 1) > 1) return 'attic';
  if (cell.hidden) return cell.stackedOn ? 'middle' : 'ground';
  return 'single';
}

// The room matches its building: halls are grand, cabins snug, attics small.
function roomDims(cell: Cell): [number, number] {
  if (cell.kind === 'main') return [1240, 740];
  if (cell.kind === 'branch') return [880, 600];
  if (cell.kind === 'issue') return [920, 600];
  if (cell.kind === 'inbox') return [1020, 660];
  const role = roomRole(cell);
  if (role === 'attic') return [860, 560];
  if (role === 'ground') return [1000, 660];
  return [1000, 620];
}

// Every block fetches its own data through the shared SWR hooks, so the scene
// is pure composition and the keys dedupe to one request per poll.
export function HouseInterior() {
  const { slug, scrub, focusId, setFocusId, aiOn, setAiOn } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = useTimeWindow(payload, scrub);
  const { cells } = useWorldModel(payload, slug, asOf);
  const cell = focusId ? cells.find(c => c.id === focusId) : null;
  const walkTargetRef = useRef<{ x: number; y: number } | null>(null);
  const [viewport, setViewport] = useState({ w: 1400, h: 900 });
  const ai = aiOn;

  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!cell) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFocusId(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cell, setFocusId]);

  // A stale click target from the last visit would walk you right back out.
  useEffect(() => {
    walkTargetRef.current = null;
  }, [focusId]);

  if (!cell) return null;

  return <InteriorScene key={cell.id} cell={cell} ai={ai} setAiOn={setAiOn} setFocusId={setFocusId} viewport={viewport} walkTargetRef={walkTargetRef} />;
}

function InteriorScene({
  cell,
  ai,
  setAiOn,
  setFocusId,
  viewport,
  walkTargetRef,
}: {
  cell: Cell;
  ai: boolean;
  setAiOn: (on: boolean) => void;
  setFocusId: (id: string | null) => void;
  viewport: { w: number; h: number };
  walkTargetRef: React.RefObject<{ x: number; y: number } | null>;
}) {
  const { slug } = useVillageUi();
  const { spec } = useRoomSpec(slug, cell.id, ai);
  const [w, h] = roomDims(cell);
  // The sign and the AI panel get their own columns, so the room never sits under either.
  const fit = Math.min(1, (viewport.w - 620) / w, (viewport.h - 48) / h);

  return (
    <div className="scene-in absolute inset-0 z-40 flex items-start gap-4 bg-[#0c0a08] p-4">
      <HouseSign cell={cell} />
      <div className="flex h-full min-w-0 flex-1 items-center justify-center">
        <div
          key={cell.id}
          className={cn(
            'pixel relative shrink-0 overflow-hidden rounded-sm border-4 border-[#2e2418] shadow-[8px_10px_0_rgb(0_0_0/0.5)]',
            // AI mode is visible on the room itself: a golden frame while it's on.
            ai && 'ring-4 ring-[#e4c05a]',
          )}
          style={{ width: w, height: h, transform: `scale(${fit})` }}
          onClick={e => {
            if ((e.target as Element).closest('a, button, [data-stop-walk]')) return;
            const rect = e.currentTarget.getBoundingClientRect();
            walkTargetRef.current = { x: (e.clientX - rect.left) / fit, y: (e.clientY - rect.top) / fit };
          }}
        >
          <WallNotes cell={cell} width={w} ai={ai} />
          <Floor cell={cell} width={w} height={h} ai={ai} />
          <Occupants cell={cell} width={w} height={h} />
          <DoorMat width={w} height={h} />
          <InteriorPlayer width={w} height={h} walkTargetRef={walkTargetRef} onExit={() => setFocusId(null)} />
          {ai ? (
            <span className="font-pixel absolute top-2 left-1/2 z-20 -translate-x-1/2 rounded-sm border-2 border-[#4a3826] bg-[#e4c05a] px-2 py-0.5 text-[11px] font-bold text-[#3a2f22]">
              {spec?.ai ? spec.theme : 'AI at work…'}
            </span>
          ) : null}
        </div>
      </div>
      <AiPanel cell={cell} ai={ai} onToggle={setAiOn} />
    </div>
  );
}

// The carpenter stands right of the room: click to hire, click to send home.
function AiPanel({ cell, ai, onToggle }: { cell: Cell; ai: boolean; onToggle: (on: boolean) => void }) {
  const { slug, setTip } = useVillageUi();
  const { spec, loading } = useRoomSpec(slug, cell.id, ai);
  const working = ai && loading;
  if (!working && !(spec?.aiAvailable && spec.commits.length > 0)) return null;

  const label = working ? 'at work…' : ai ? 'AI room' : 'draw this room with AI';

  return (
    <aside className="z-50 w-36 shrink-0">
      <button
        onClick={() => onToggle(!ai)}
        role="switch"
        aria-checked={ai}
        aria-label="Draw this room with AI"
        onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, title: label, body: !working && spec?.ai ? spec.theme : null, when: null })}
        onMouseLeave={() => setTip(null)}
        className={cn(
          'panel pixel flex w-full cursor-pointer flex-col items-center rounded-sm p-2.5 transition-transform hover:-translate-y-0.5',
          ai && 'ring-2 ring-[#e4c05a]',
          !ai && !working && 'opacity-80',
        )}
      >
        <span className="relative">
          {working ? (
            <span aria-hidden className="absolute -top-1 -right-2">
              {[0, 1].map(i => (
                <span key={i} className="smoke-puff absolute h-1.5 w-1.5 rounded-full bg-[#d8c9a8]" style={{ animationDelay: `${i * 800}ms` }} />
              ))}
            </span>
          ) : null}
          <span className={cn('block', working && 'sprite-bob')}>
            <PixelSprite art={CARPENTER.art} palette={CARPENTER.palette} scale={4} />
          </span>
        </span>
        {/* A real switch: track and knob, no guessing which state you're in. */}
        <span
          aria-hidden
          className={cn(
            'mt-2 flex h-5 w-10 items-center rounded-sm border-2 border-[#4a3826] px-0.5 transition-colors',
            ai ? 'justify-end bg-[#e4c05a]' : 'justify-start bg-[#b5a687]',
          )}
        >
          <span className="h-3 w-3.5 rounded-xs border border-[#4a3826] bg-[#f7efdc]" />
        </span>
        <span className="font-pixel mt-1.5 text-center text-[11px] leading-4 font-bold text-[#3a2f22]">{label}</span>
      </button>
      {!working && ai && spec && !spec.ai ? <p className="font-pixel mt-1.5 text-[11px] text-[#f0e6d2]/70">couldn’t draw this one</p> : null}
    </aside>
  );
}

// Surfaces are the room's own, never the AI's: deterministic per house.
function cellHash(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function wallClass(cell: Cell): string {
  if (cell.kind === 'issue') return 'room-wall-tent';
  if (cell.kind === 'branch') return 'room-wall-log';
  if (cell.kind === 'main') return 'room-wall-hall';
  if (cell.kind === 'inbox') return 'room-wall-hedge';
  const role = roomRole(cell);
  if (role === 'attic') return 'room-wall-log';
  if (role === 'ground') return 'room-wall-stone';
  return `room-wall-${['cream', 'sage', 'sky'][cellHash(cell.id) % 3]}`;
}

function floorClass(cell: Cell): string {
  if (cell.kind === 'issue' || cell.kind === 'inbox') return 'room-floor-ground';
  if (cell.kind === 'branch') return 'room-floor-wood';
  if (cell.kind === 'main') return 'room-floor-stone';
  const role = roomRole(cell);
  if (role === 'attic') return 'room-floor-wood';
  if (role === 'ground') return 'room-floor-carpet';
  return `room-floor-${['wood', 'carpet'][cellHash(cell.id) % 2]}`;
}

// One anchor per room, sized for the middle of the floor. Not a fireplace
// everywhere: the hall feasts, the cabin stores, the attic keeps a chest,
// only the living room at the bottom of a stack gets the hearth.
function centerpiece(cell: Cell): { art: string[]; palette: Record<string, string>; scale: number } | null {
  if (cell.kind === 'inbox') return { ...WELL, scale: 6 };
  if (cell.kind === 'main') return { ...TABLE_LONG, scale: 7 };
  if (cell.kind === 'branch') return { ...BARREL, scale: 7 };
  const role = roomRole(cell);
  if (role === 'attic') return { ...CHEST, scale: 7 };
  if (role === 'ground') return { ...FIREPLACE, scale: 7 };
  return { ...WORKBENCH, scale: 6 };
}

function WallNotes({ cell, width, ai }: { cell: Cell; width: number; ai: boolean }) {
  const { slug, scrub } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = useTimeWindow(payload, scrub);
  const { cells } = useWorldModel(payload, slug, asOf);
  const { spec, loading } = useRoomSpec(slug, cell.id, ai);
  const notes = roomFor(payload, cells, cell.id).notes;
  const outdoors = cell.kind === 'issue' || cell.kind === 'inbox';

  // First entry only — toggling AI must never blank the wall.
  if (loading && !spec) return <WallSkeleton />;

  return (
    <div className={cn('absolute inset-x-0 top-0', wallClass(cell))} style={{ height: WALL_H }}>
      {!outdoors ? (
        <>
          <span className="pixel absolute top-6 left-8">
            <PixelSprite art={WINDOW.art} palette={WINDOW.palette} scale={8} className="dark:hidden" />
            <PixelSprite art={WINDOW.art} palette={{ ...WINDOW.palette, b: WINDOW.palette.n }} scale={8} className="hidden dark:block" />
          </span>
          <span className="pixel absolute top-6 right-8">
            <PixelSprite art={WINDOW.art} palette={WINDOW.palette} scale={8} className="dark:hidden" />
            <PixelSprite art={WINDOW.art} palette={{ ...WINDOW.palette, b: WINDOW.palette.n }} scale={8} className="hidden dark:block" />
          </span>
        </>
      ) : null}

      {/* One row of notes, scrollable sideways when the wall fills up. */}
      <div
        data-stop-walk
        className="absolute top-3.5 bottom-3 flex gap-2 overflow-x-auto overflow-y-hidden"
        style={{ left: outdoors ? 24 : 110, right: outdoors ? 24 : 110 }}
      >
        {notes.map((note, i) => (
          <StickyNote key={note.id} note={note} tilt={((i * 47) % 9) - 4} />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-2.5 bg-black/25" />
      <span className="sr-only">wall width {width}</span>
    </div>
  );
}

function Floor({ cell, width, height, ai }: { cell: Cell; width: number; height: number; ai: boolean }) {
  const { slug } = useVillageUi();
  const { spec, loading } = useRoomSpec(slug, cell.id, ai);
  const campsite = cell.kind === 'issue';
  const plaza = cell.kind === 'inbox';
  const commits = campsite || plaza ? [] : (spec?.commits ?? []);

  // Skeleton only on the very first entry. Toggling AI never locks the room:
  // the old furniture is carried out and the new set pops in when it's ready.
  if (loading && !spec) return <FloorSkeleton />;
  const redecorating = loading && Boolean(spec) && (spec?.ai ?? false) !== ai;

  const anchor = campsite ? null : centerpiece(cell);
  const floorH = height - WALL_H;
  const builds = redecorating ? [] : toBuilds(commits, spec?.items);
  const slots = furnitureSlots(builds.length, width, floorH);

  return (
    <div className={cn('absolute inset-x-0 bottom-0', floorClass(cell))} style={{ top: WALL_H }}>
      {campsite ? <Campsite width={width} height={floorH} /> : null}
      {anchor ? (
        <span
          aria-hidden
          className="pixel pointer-events-none absolute"
          style={{ left: width / 2, top: floorH / 2 - 20, transform: 'translate(-50%, -50%)', zIndex: 1 }}
        >
          <PixelSprite art={anchor.art} palette={anchor.palette} scale={anchor.scale} />
        </span>
      ) : null}
      {builds.map((build, i) => (
        <Furniture key={build.commits[0].sha} build={build} x={slots[i].x} y={slots[i].y} delay={i * 90} />
      ))}
    </div>
  );
}

// Furniture fills the room tile by tile from the back-left corner, clear of
// the wall band above and leaving the middle to the centerpiece.
function furnitureSlots(count: number, w: number, floorH: number): { x: number; y: number }[] {
  const step = TILE * 2.5;
  const cols = Math.max(1, Math.floor((w - TILE * 2) / step));
  const slots: { x: number; y: number }[] = [];
  for (let i = 0; slots.length < count && i < 60; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = TILE + col * step + step / 2;
    const y = 100 + row * TILE * 1.9;
    if (Math.abs(x - w / 2) < 170 && Math.abs(y - (floorH / 2 - 20)) < 120) continue;
    slots.push({ x, y });
  }
  return slots;
}

function Campsite({ width, height }: { width: number; height: number }) {
  return (
    <>
      <span className="pixel absolute" style={{ left: width / 2, top: height / 2 - 20, transform: 'translate(-50%, -50%)' }}>
        <PixelSprite art={CAMPFIRE.art} palette={CAMPFIRE.palette} scale={7} />
      </span>
      {[
        { x: width / 2 - 130, y: height / 2 - 30, rot: 90 },
        { x: width / 2 + 130, y: height / 2 - 30, rot: 90 },
        { x: width / 2, y: height / 2 + 80, rot: 0 },
      ].map((s, i) => (
        <span key={i} className="pixel absolute" style={{ left: s.x, top: s.y, transform: `translate(-50%, -50%) rotate(${s.rot}deg)` }}>
          <PixelSprite art={LOG_SEAT.art} palette={LOG_SEAT.palette} scale={5} />
        </span>
      ))}
    </>
  );
}

type Build = { commits: BranchCommit[]; name?: string; kind?: string; pieces?: string[][] };

// Related commits become one build; anything the spec didn't cover still shows
// up as its own piece.
function toBuilds(commits: BranchCommit[], items: RoomSpecItem[] | undefined): Build[] {
  if (!items?.length) return commits.map(c => ({ commits: [c] }));
  const covered = new Set<number>();
  const builds: Build[] = [];
  for (const item of items) {
    const own = item.commits.filter(i => i >= 0 && i < commits.length && !covered.has(i)).map(i => commits[i]);
    item.commits.forEach(i => covered.add(i));
    if (own.length > 0) builds.push({ commits: own, name: item.name, kind: item.kind, pieces: item.pieces });
  }
  commits.forEach((c, i) => {
    if (!covered.has(i)) builds.push({ commits: [c] });
  });
  return builds;
}

// One clickable segment per commit. AI-drawn segments join flush into one
// invented machine; catalog fallbacks stand together as a matching set.
function Furniture({ build, x, y, delay = 0 }: { build: Build; x: number; y: number; delay?: number }) {
  const { setTip } = useVillageUi();
  const fallback = (build.kind ? furnitureByName(build.kind) : null) ?? furnitureFor(build.commits[0].sha);
  const name = build.name ?? fallback.name;
  const n = build.commits.length;
  const drawn = Boolean(build.pieces?.length);

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: Math.round(y) }}
    >
      {/* pop-in animates transform, so it lives inside the positioning wrapper */}
      <div className="pop-in flex flex-col items-center" style={{ animationDelay: `${delay}ms` }}>
        <div className="flex items-end">
        {build.commits.map((commit, i) => {
          const piece = drawn ? (build.pieces![i] ?? build.pieces![build.pieces!.length - 1]) : fallback.art;
          const palette = drawn ? AI_ART_PALETTE : fallback.palette;
          return (
            <a
              key={commit.sha}
              href={commit.url}
              target="_blank"
              rel="noreferrer"
              className="transition-transform hover:-translate-y-1"
              style={drawn ? undefined : { marginLeft: i === 0 ? 0 : -6, translate: `0 ${(i % 2) * 4}px` }}
              onMouseMove={e =>
                setTip({ x: e.clientX, y: e.clientY, title: `${name} by ${commit.author}`, body: commit.message, when: commit.at || null })
              }
              onMouseLeave={() => setTip(null)}
            >
              <PixelSprite art={piece} palette={palette} scale={drawn ? 6 : n > 2 ? 4 : 5} />
            </a>
          );
        })}
        </div>
        <span aria-hidden className="mt-0.5 block h-1 w-7 rounded-full bg-black/30" />
        <span className="font-pixel mt-0.5 block max-w-28 truncate rounded-sm bg-black/45 px-1 text-[11px] leading-4 text-white/90">
          {name}
        </span>
      </div>
    </div>
  );
}

function Occupants({ cell, width, height }: { cell: Cell; width: number; height: number }) {
  const { slug, scrub, setTip } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = useTimeWindow(payload, scrub);
  const { actors } = useWorldModel(payload, slug, asOf);
  const here = actors.filter(a => a.cellId === cell.id);
  if (here.length === 0) return null;

  return (
    <>
      {here.map((a, i) => {
        // People gather in a ring around the room's centerpiece, never on it.
        const ring = Math.floor(i / 10);
        const inRing = Math.min(10, here.length - ring * 10);
        const angle = ((i % 10) / inRing) * Math.PI * 2 - Math.PI / 2;
        const x = width / 2 + Math.cos(angle) * (Math.min(200, width / 2 - 90) + ring * 55);
        const y = WALL_H + (height - WALL_H) / 2 - 20 + Math.sin(angle) * (Math.min(120, (height - WALL_H) / 2 - 70) + ring * 26);
        return (
          <a
            key={a.login}
            href={`https://github.com/${a.login}`}
            target="_blank"
            rel="noreferrer"
            data-stop-walk
            className="absolute flex flex-col items-center transition-transform hover:-translate-y-0.5"
            style={{ left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: Math.round(y) }}
            onMouseMove={e =>
              setTip({
                x: e.clientX,
                y: e.clientY,
                title: a.login,
                body: `${a.event.line}${a.event.detail ? `: ${a.event.detail}` : ''}`,
                when: a.event.at,
              })
            }
            onMouseLeave={() => setTip(null)}
          >
            <div className="sprite-bob relative">
              {a.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${a.avatar}?size=64`} alt={a.login} width={30} height={30} className="rounded-sm border-2 border-[#2e2418] shadow" />
              ) : (
                <span className="bg-secondary block h-7.5 w-7.5 rounded-sm border-2 border-[#2e2418]" />
              )}
              <span className="absolute -top-2 -right-2">
                <KindBadge kind={a.event.kind} />
              </span>
            </div>
            <span className="font-pixel mt-0.5 rounded-sm bg-black/45 px-1 text-[11px] text-white/90">{a.login}</span>
          </a>
        );
      })}
    </>
  );
}

function DoorMat({ width, height }: { width: number; height: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute flex flex-col items-center" style={{ left: width / 2, top: height - 4, transform: 'translate(-50%, -100%)', zIndex: 5 }}>
      <span className="h-7 w-20 rounded-t-sm border-2 border-b-0 border-[#4a3826] bg-[#8a5a33] shadow-[inset_0_3px_0_rgb(255_255_255/0.15)]" />
      <span className="font-pixel -mt-6 mb-1 text-[10px] text-[#f0e6d2]/90">walk out</span>
    </div>
  );
}

// Stepping on the door mat leaves the house.
function InteriorPlayer({
  width,
  height,
  walkTargetRef,
  onExit,
}: {
  width: number;
  height: number;
  walkTargetRef: React.RefObject<{ x: number; y: number } | null>;
  onExit: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const exitRef = useRef(onExit);

  useEffect(() => {
    exitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    const s = { x: width / 2, y: height - 78, keys: new Set<string>(), dir: 1, left: false };
    const SPEED = 4;
    const matX = width / 2;
    const matY = height - 16;

    function onKeyDown(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
        e.preventDefault();
        s.keys.add(k);
        walkTargetRef.current = null;
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      s.keys.delete(e.key.toLowerCase());
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      let dx = 0;
      let dy = 0;
      if (s.keys.size > 0) {
        if (s.keys.has('arrowleft') || s.keys.has('a')) dx -= 1;
        if (s.keys.has('arrowright') || s.keys.has('d')) dx += 1;
        if (s.keys.has('arrowup') || s.keys.has('w')) dy -= 1;
        if (s.keys.has('arrowdown') || s.keys.has('s')) dy += 1;
      } else if (walkTargetRef.current) {
        const gx = walkTargetRef.current.x - s.x;
        const gy = walkTargetRef.current.y - s.y;
        const dist = Math.hypot(gx, gy);
        if (dist > SPEED) {
          dx = gx / dist;
          dy = gy / dist;
        } else {
          walkTargetRef.current = null;
        }
      }
      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy) || 1;
        s.x = Math.max(36, Math.min(width - 36, s.x + (dx / len) * SPEED));
        s.y = Math.max(WALL_H + 26, Math.min(height - 22, s.y + (dy / len) * SPEED));
        if (dx !== 0) s.dir = dx > 0 ? 1 : -1;
        inner.current?.classList.add('sprite-bob');
        if (!s.left && Math.hypot(s.x - matX, s.y - matY) < 30) {
          s.left = true;
          exitRef.current();
        }
      } else {
        inner.current?.classList.remove('sprite-bob');
      }
      if (ref.current) {
        ref.current.style.transform = `translate(${s.x - 13}px, ${s.y - 30}px)`;
        ref.current.style.zIndex = `${Math.round(s.y)}`;
      }
      if (inner.current) inner.current.style.transform = `scaleX(${s.dir})`;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [width, height, walkTargetRef]);

  return (
    <div ref={ref} className="absolute" style={{ transform: `translate(${width / 2 - 13}px, ${height - 108}px)` }}>
      <div className="flex flex-col items-center">
        <div ref={inner} className="pixel">
          <PlayerSprite />
        </div>
        <span aria-hidden className="mt-0.5 h-1.5 w-6 rounded-full bg-black/50 blur-[2px]" />
      </div>
    </div>
  );
}

function HouseSign({ cell }: { cell: Cell }) {
  const { slug, setFocusId } = useVillageUi();
  const { payload } = useVillageData(slug);

  const prs = payload.prs;
  const me = cell.kind === 'pr' ? prs.find(p => `pr:${p.number}` === cell.id) : undefined;
  const stack: typeof prs = [];
  if (me) {
    const seen = new Set([me.number]);
    let cur = me;
    for (;;) {
      const child = prs.find(p => p.baseRef === cur.branch && !seen.has(p.number));
      if (!child) break;
      stack.unshift(child);
      seen.add(child.number);
      cur = child;
    }
    stack.push(me);
    cur = me;
    for (;;) {
      const parent = prs.find(p => p.branch === cur.baseRef && !seen.has(p.number));
      if (!parent) break;
      stack.push(parent);
      seen.add(parent.number);
      cur = parent;
    }
  }

  // Name the floor you're standing on, not the cell's own chain depth.
  const idx = stack.findIndex(p => `pr:${p.number}` === cell.id);
  const floorNo = idx >= 0 ? stack.length - idx : 1;
  const chip = cell.kind !== 'pr' ? null : stack.length > 1 ? `⌂ ${floorNo}/${stack.length}` : cell.prState === 'ready' ? 'ready' : null;

  return (
    <aside className="panel z-50 w-80 shrink-0 rounded-sm p-3">
      <p className="font-pixel text-[17px] leading-5 font-bold">{cell.label}</p>
      {/* Fixed two-line box so hopping between floors of a stack never shifts the panel. */}
      <p className="mt-1 line-clamp-2 min-h-9 text-[13px] leading-4.5 text-[#5a4a32]">{cell.sub}</p>
      <span className="mt-2 flex items-center gap-1.5">
        {chip ? (
          <span
            className={cn(
              'font-pixel inline-block rounded-sm border-2 border-[#4a3826] px-1.5 py-0.5 text-[11px] font-bold',
              stack.length > 1 ? 'bg-[#8a6a9d] text-white' : 'bg-[#58a55c] text-white',
            )}
          >
            {chip}
          </span>
        ) : null}
        {cell.draft ? (
          <span className="pixel" title="draft, under construction">
            <PixelSprite art={BARRIER.art} palette={BARRIER.palette} scale={3} />
          </span>
        ) : null}
      </span>
      {cell.ref ? (
        <p className="mt-2 truncate font-mono text-[11px] text-[#6b5b43]">
          {cell.ref} → {cell.baseRef}
        </p>
      ) : null}
      {cell.author ? <p className="mt-1 text-[12px] text-[#6b5b43]">by {cell.author}</p> : null}

      {stack.length > 1 ? (
        <div className="mt-2 border-t-2 border-[#4a3826]/40 pt-1.5">
          <ul className="mt-1 flex flex-col gap-0.5">
            {stack.map(pr => {
              const here = `pr:${pr.number}` === cell.id;
              const hasHouse = pickedPrs(payload).some(p => p.number === pr.number);
              return (
                <li key={pr.number}>
                  <button
                    type="button"
                    disabled={!hasHouse || here}
                    onClick={() => setFocusId(`pr:${pr.number}`)}
                    className={cn(
                      'flex w-full min-w-0 items-baseline gap-1.5 rounded-xs border-2 px-1.5 py-0.5 text-left',
                      here ? 'border-[#4a3826] bg-[#e0d3b8]' : 'border-transparent hover:border-[#4a3826]/40',
                      hasHouse && !here && 'cursor-pointer',
                    )}
                  >
                    <span className="font-pixel shrink-0 text-[13px] font-bold text-[#3a2f22]">#{pr.number}</span>
                    <span className="truncate text-[13px] text-[#6b5b43]">{pr.title}</span>
                    {pr.draft ? (
                      <span className="pixel shrink-0 self-center" title="draft">
                        <PixelSprite art={BARRIER.art} palette={BARRIER.palette} scale={2} />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <div className="mt-2 border-t-2 border-[#4a3826]/40 pt-2">
        <a href={cell.url} target="_blank" rel="noreferrer" className="font-pixel flex items-center gap-1 text-[12px] font-bold text-[#8a4a2b] hover:underline">
          open on github <ArrowUpRight size={11} strokeWidth={3} />
        </a>
      </div>
    </aside>
  );
}

function StickyNote({ note, tilt }: { note: WireEvent; tilt: number }) {
  const { setTip } = useVillageUi();
  return (
    <a
      href={note.url ?? undefined}
      target="_blank"
      rel="noreferrer"
      data-stop-walk
      className="sticky-note relative h-28 w-28 shrink-0 p-2 pb-4 text-left transition-transform hover:-translate-y-1"
      style={{ rotate: `${tilt}deg` }}
      onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, title: `${note.actor} ${note.line}`, body: note.body, when: note.at })}
      onMouseLeave={() => setTip(null)}
      aria-label={`Note from ${note.actor}`}
    >
      {note.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${note.avatar}?size=32`} alt="" width={15} height={15} className="absolute top-1.5 right-1.5 rounded-full border border-black/30" />
      ) : null}
      {/* No `block` next to line-clamp: they both set display and block wins,
          which is exactly how text used to spill off the note. */}
      <span className="line-clamp-4 font-mono text-[10px] leading-[1.4] wrap-break-word text-[#5a4a1e]">{note.body}</span>
      <span className="absolute bottom-1 left-2 font-mono text-[8px] font-bold text-[#8a6d2a]">
        <RelativeTime date={note.at} />
      </span>
    </a>
  );
}

function WallSkeleton() {
  return <div aria-hidden className="room-dim absolute inset-x-0 top-0" style={{ height: WALL_H }} />;
}

function FloorSkeleton() {
  return (
    <div className="room-dim absolute inset-x-0 bottom-0" style={{ top: WALL_H }}>
      <p className="font-pixel absolute top-1/2 left-1/2 -translate-1/2 text-[13px] text-[#f0e6d2]/50">stepping inside…</p>
    </div>
  );
}
