'use client';

import { ArrowUpRight } from 'lucide-react';
import { Suspense, useEffect, useRef } from 'react';
import ErrorBoundary from '@/components/ui/error-boundary';
import { RelativeTime } from '@/components/ui/relative-time';
import { AI_ART_PALETTE, furnitureByName, furnitureFor, KindBadge, PixelSprite, RUG } from '@/features/village/components/pixel-sprite';
import { PlayerSprite } from '@/features/village/components/player';
import { useRoomSpec, useTimeWindow, useVillageData, useWorldModel, type RoomSpecItem } from '@/features/village/use-village-data';
import { roomFor, type Cell } from '@/features/village/village-model';
import { useVillageUi } from '@/features/village/village-ui-context';
import { cn } from '@/lib/utils';
import type { WireEvent } from '@/types/github';

// Room canvas per size: [width, height]. The wall band is WALL_H tall; the rest is floor.
const DIMS: Record<'S' | 'M' | 'L', [number, number]> = { S: [780, 560], M: [940, 620], L: [1100, 680] };
const WALL_H = 150;

// Each block below fetches its own data through the shared SWR hooks — the scene
// is composition, not prop-drilling. Same keys dedupe to one request per poll.
export function HouseInterior() {
  const { slug, scrub, focusId, setFocusId } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = useTimeWindow(payload, scrub);
  const { cells } = useWorldModel(payload, slug, asOf);
  const cell = focusId ? cells.find(c => c.id === focusId) : null;
  const walkTarget = useRef<{ x: number; y: number } | null>(null);

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
    walkTarget.current = null;
  }, [focusId]);

  if (!cell) return null;

  const room = roomFor(payload, cells, cell.id);
  const [w, h] = DIMS[room.size];

  return (
    <div className="scene-in absolute inset-0 z-40 flex items-center justify-center bg-[#0c0a08] p-4">
      <div
        key={cell.id}
        className="pixel relative shrink-0 overflow-hidden rounded-sm border-4 border-[#2e2418] shadow-[8px_10px_0_rgb(0_0_0/0.5)]"
        style={{ width: w, height: h }}
        onClick={e => {
          if ((e.target as Element).closest('a, button, [data-stop-walk]')) return;
          const rect = e.currentTarget.getBoundingClientRect();
          walkTarget.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }}
      >
        {/* The door stays dark until the room's design has loaded — no repaint flash. */}
        <ErrorBoundary title="The wall fell over">
          <Suspense fallback={<WallSkeleton />}>
            <WallNotes cellId={cell.id} width={w} />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary title="The furniture didn’t arrive">
          <Suspense fallback={<FloorSkeleton />}>
            <Floor cell={cell} width={w} height={h} />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary title="Nobody home">
          <Occupants cellId={cell.id} width={w} height={h} />
        </ErrorBoundary>
        <DoorMat width={w} height={h} />
        <InteriorPlayer width={w} height={h} walkTarget={walkTarget} onExit={() => setFocusId(null)} />
      </div>
      <HouseSign cell={cell} />
    </div>
  );
}

// ── The wall: wallpaper + review notes pinned where everyone can see them ────
function WallNotes({ cellId, width }: { cellId: string; width: number }) {
  const { slug, scrub } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = useTimeWindow(payload, scrub);
  const { cells } = useWorldModel(payload, slug, asOf);
  const spec = useRoomSpec(slug, cellId);
  const notes = roomFor(payload, cells, cellId).notes.slice(0, 8);

  return (
    <div className={cn('absolute inset-x-0 top-0', `room-wall-${spec?.wall ?? 'cream'}`)} style={{ height: WALL_H }}>
      {/* window with day/night light */}
      <span aria-hidden className="absolute top-6 left-8 h-16 w-12 border-4 border-[#5a4632] bg-[#bfe0f5] dark:bg-[#1a2c55]">
        <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-[#5a4632]" />
        <span className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-[#5a4632]" />
      </span>
      <span aria-hidden className="absolute top-6 right-8 h-16 w-12 border-4 border-[#5a4632] bg-[#bfe0f5] dark:bg-[#1a2c55]">
        <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-[#5a4632]" />
        <span className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-[#5a4632]" />
      </span>

      <div className="absolute top-4 flex flex-wrap gap-2" style={{ left: 90, right: 90 }}>
        {notes.length === 0 ? (
          <p className="font-pixel rounded-sm bg-black/25 px-2 py-1 text-[12px] text-white/80">no review notes on the wall yet</p>
        ) : (
          notes.map((note, i) => <StickyNote key={note.id} note={note} tilt={((i * 47) % 9) - 4} />)
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-2.5 bg-black/25" />
      <span className="sr-only">wall width {width}</span>
    </div>
  );
}

// ── The floor: one piece of furniture per commit, rug in the middle ──────────
// The town square is the exception: nothing is built there, people just pass by.
function Floor({ cell, width, height }: { cell: Cell; width: number; height: number }) {
  const { slug, scrub } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = useTimeWindow(payload, scrub);
  const { cells } = useWorldModel(payload, slug, asOf);
  const spec = useRoomSpec(slug, cell.id);
  const square = cell.kind === 'inbox';
  const commits = square ? [] : roomFor(payload, cells, cell.id).commits.slice(0, 14);
  const slots = furnitureSlots(width, height);

  return (
    <div className={cn('absolute inset-x-0 bottom-0', square ? 'room-floor-stone' : `room-floor-${spec?.floor ?? 'wood'}`)} style={{ top: WALL_H }}>
      {commits.length >= 3 ? (
        <span
          aria-hidden
          className="pointer-events-none absolute opacity-90"
          style={{ left: width / 2, top: (height - WALL_H) / 2, transform: 'translate(-50%, -50%)', zIndex: 1 }}
        >
          <PixelSprite art={RUG.art} palette={RUG.palette} scale={6} />
        </span>
      ) : null}
      {toBuilds(commits, spec?.items).map((build, i) => {
        const slot = slots[i % slots.length];
        return <Furniture key={build.events[0].id} build={build} x={slot.x} y={slot.y} />;
      })}
    </div>
  );
}

type Build = { events: WireEvent[]; name?: string; kind?: string; art?: string[] };

// Related commits become one build (the AI groups them); anything the AI didn't
// cover still shows up as its own piece. Without AI it's one build per commit.
function toBuilds(commits: WireEvent[], items: RoomSpecItem[] | undefined): Build[] {
  if (!items?.length) return commits.map(c => ({ events: [c] }));
  const covered = new Set<number>();
  const builds: Build[] = [];
  for (const item of items) {
    const events = item.commits.filter(i => i >= 0 && i < commits.length && !covered.has(i)).map(i => commits[i]);
    item.commits.forEach(i => covered.add(i));
    if (events.length > 0) builds.push({ events, name: item.name, kind: item.kind, art: item.art });
  }
  commits.forEach((c, i) => {
    if (!covered.has(i)) builds.push({ events: [c] });
  });
  return builds;
}

// Furniture stands along the walls first, then fills the middle — never on the door.
function furnitureSlots(w: number, h: number): { x: number; y: number }[] {
  const floorH = h - WALL_H;
  const slots: { x: number; y: number }[] = [];
  for (let x = 90; x <= w - 90; x += 108) slots.push({ x, y: 52 });
  for (let y = 170; y <= floorH - 120; y += 112) {
    slots.push({ x: 64, y });
    slots.push({ x: w - 64, y });
  }
  for (let x = 200; x <= w - 200; x += 132) slots.push({ x, y: floorH - 130 });
  return slots;
}

// The AI shapes and sizes the piece (drawn art or catalog); the words on and
// around it stay the real commits' — that's what you came in to read.
function Furniture({ build, x, y }: { build: Build; x: number; y: number }) {
  const { setTip } = useVillageUi();
  const primary = build.events[0];
  const fallback = (build.kind ? furnitureByName(build.kind) : null) ?? furnitureFor(primary.id);
  const art = build.art?.length ? build.art : fallback.art;
  const palette = build.art?.length ? AI_ART_PALETTE : fallback.palette;
  // The commit message is the point. Only when a push carries none (force-push,
  // empty payload) does the AI's name for the work stand in.
  const message = primary.detail ?? build.name ?? primary.line;
  // Bigger work → bigger furniture: scale by commits represented, not hype.
  const weight = build.events.reduce((sum, e) => sum + Math.max(1, e.count ?? 1), 0);
  const scale = weight >= 12 ? 7 : weight >= 6 ? 6 : weight >= 3 ? 5 : 4;
  const tip = (e: React.MouseEvent) =>
    setTip({
      x: e.clientX,
      y: e.clientY,
      title: `${build.name ?? fallback.name} · by ${primary.actor}`,
      body: build.events.map(ev => ev.detail ?? ev.line).join('\n'),
      when: primary.at,
    });
  const inner = (
    <>
      <PixelSprite art={art} palette={palette} scale={scale} />
      <span aria-hidden className="mx-auto mt-0.5 block h-1 w-7 rounded-full bg-black/30" />
      <span className="font-pixel mt-0.5 block max-w-36 truncate rounded-sm bg-black/45 px-1 text-[10px] leading-4 text-white/90">
        {message}
      </span>
      {build.events.length > 1 ? (
        <span className="font-pixel absolute -top-2 -right-2 rounded-sm border border-black/40 bg-[#f0e6d2] px-1 text-[10px] font-bold text-[#3a2f22]">
          ×{build.events.length}
        </span>
      ) : null}
    </>
  );
  const style = { left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: Math.round(y) } as const;
  return primary.url ? (
    <a
      href={primary.url}
      target="_blank"
      rel="noreferrer"
      className="absolute flex flex-col items-center transition-transform hover:-translate-y-0.5"
      style={style}
      onMouseMove={tip}
      onMouseLeave={() => setTip(null)}
    >
      {inner}
    </a>
  ) : (
    <div
      className="absolute flex cursor-help flex-col items-center transition-transform hover:-translate-y-0.5"
      style={style}
      onMouseMove={tip}
      onMouseLeave={() => setTip(null)}
    >
      {inner}
    </div>
  );
}

// ── Whoever's working here right now, standing around the room ───────────────
function Occupants({ cellId, width, height }: { cellId: string; width: number; height: number }) {
  const { slug, scrub, setTip } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = useTimeWindow(payload, scrub);
  const { actors } = useWorldModel(payload, slug, asOf);
  const here = actors.filter(a => a.cellId === cellId);
  if (here.length === 0) return null;

  return (
    <>
      {here.map((a, i) => {
        // Rows of 8, filling upward — a crowd stacks instead of overlapping.
        const row = Math.floor(i / 8);
        const col = i % 8;
        const inRow = Math.min(8, here.length - row * 8);
        const x = width / 2 + (col - (inRow - 1) / 2) * 78;
        const y = height - 170 - row * 68;
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
                body: `${a.event.line}${a.event.detail ? ` — ${a.event.detail}` : ''}`,
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

// ── The way out: walk onto the mat like a Stardew door ───────────────────────
function DoorMat({ width, height }: { width: number; height: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute flex flex-col items-center" style={{ left: width / 2, top: height - 4, transform: 'translate(-50%, -100%)', zIndex: 5 }}>
      <span className="h-7 w-20 rounded-t-sm border-2 border-b-0 border-[#4a3826] bg-[#8a5a33] shadow-[inset_0_3px_0_rgb(255_255_255/0.15)]" />
      <span className="font-pixel -mt-6 mb-1 text-[10px] text-[#f0e6d2]/90">walk out</span>
    </div>
  );
}

// You, indoors. Same controls as outside; stepping on the mat leaves the house.
function InteriorPlayer({
  width,
  height,
  walkTarget,
  onExit,
}: {
  width: number;
  height: number;
  walkTarget: React.RefObject<{ x: number; y: number } | null>;
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
        walkTarget.current = null;
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
      } else if (walkTarget.current) {
        const gx = walkTarget.current.x - s.x;
        const gy = walkTarget.current.y - s.y;
        const dist = Math.hypot(gx, gy);
        if (dist > SPEED) {
          dx = gx / dist;
          dy = gy / dist;
        } else {
          walkTarget.current = null;
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
  }, [width, height, walkTarget]);

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

// ── The sign: which PR you're standing in, always visible ────────────────────
function HouseSign({ cell }: { cell: Cell }) {
  const { slug, setFocusId } = useVillageUi();
  const { payload } = useVillageData(slug);

  // The whole stack this PR lives in, top floor first: who's stacked on me,
  // me, and everything I'm stacked on, down to the ground.
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

  const chip =
    cell.kind !== 'pr'
      ? null
      : cell.prState === 'stacked'
        ? `stacked on #${cell.stackedOn}${cell.draft ? ' · draft' : ''}`
        : cell.prState === 'draft'
          ? 'draft'
          : 'ready for review';

  return (
    <aside className="panel absolute top-4 left-4 z-50 w-72 rounded-sm p-3">
      <p className="font-pixel text-[16px] leading-5 font-bold">{cell.label}</p>
      {cell.sub ? <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#5a4a32]">{cell.sub}</p> : null}
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {chip ? (
          <span
            className={cn(
              'font-pixel rounded-sm border-2 border-[#4a3826] px-1 py-px text-[10px] font-bold',
              cell.prState === 'ready' ? 'bg-[#58a55c] text-white' : cell.prState === 'stacked' ? 'bg-[#8a6a9d] text-white' : 'bg-[#e4c05a] text-[#3a2f22]',
            )}
          >
            {chip}
          </span>
        ) : null}
        {cell.ref ? (
          <span className="max-w-full truncate font-mono text-[10px] text-[#6b5b43]">
            {cell.ref} → {cell.baseRef}
          </span>
        ) : null}
      </div>
      {cell.author ? <p className="mt-1 text-[11px] text-[#6b5b43]">by {cell.author}</p> : null}

      {stack.length > 1 ? (
        <div className="mt-2 border-t-2 border-[#4a3826]/40 pt-1.5">
          <p className="font-pixel text-[10px] font-bold text-[#8a6d2a]">the stack, top floor first</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {stack.map(pr => {
              const here = `pr:${pr.number}` === cell.id;
              const hasHouse = Boolean(prs.slice(0, 8).find(p => p.number === pr.number));
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
                    <span className="font-pixel shrink-0 text-[11px] font-bold text-[#3a2f22]">#{pr.number}</span>
                    <span className="truncate text-[11px] text-[#6b5b43]">{pr.title}</span>
                    {pr.draft ? <span className="font-pixel shrink-0 text-[9px] text-[#8a6d2a]">draft</span> : null}
                  </button>
                </li>
              );
            })}
            <li className="font-pixel px-1.5 text-[10px] text-[#8a6d2a]">⌂ {stack[stack.length - 1].baseRef} — the ground</li>
          </ul>
        </div>
      ) : null}
      <div className="mt-2 flex items-center justify-between border-t-2 border-[#4a3826]/40 pt-2">
        <a href={cell.url} target="_blank" rel="noreferrer" className="font-pixel flex items-center gap-1 text-[12px] font-bold text-[#8a4a2b] hover:underline">
          open on github <ArrowUpRight size={11} strokeWidth={3} />
        </a>
        <span className="font-pixel text-[10px] text-[#8a6d2a]">esc · leave</span>
      </div>
    </aside>
  );
}

// Dark room while the design loads — the lights come on when it's furnished.
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

function StickyNote({ note, tilt }: { note: WireEvent; tilt: number }) {
  const { setTip } = useVillageUi();
  return (
    <a
      href={note.url ?? undefined}
      target="_blank"
      rel="noreferrer"
      data-stop-walk
      className="sticky-note relative h-16 w-16 p-1 text-left transition-transform hover:scale-110 hover:rotate-0"
      style={{ transform: `rotate(${tilt}deg)` }}
      onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, title: `${note.actor} · ${note.line}`, body: note.body, when: note.at })}
      onMouseLeave={() => setTip(null)}
      aria-label={`Note from ${note.actor}`}
    >
      {note.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${note.avatar}?size=32`} alt="" width={12} height={12} className="absolute top-1 right-1 rounded-full border border-black/30" />
      ) : null}
      <span className="line-clamp-3 block font-mono text-[8.5px] leading-[1.4] wrap-break-word text-[#5a4a1e]">{note.body}</span>
      <span className="absolute right-0.5 bottom-0.5 font-mono text-[7px] font-bold text-[#8a6d2a]">
        <RelativeTime date={note.at} />
      </span>
    </a>
  );
}
