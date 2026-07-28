'use client';

import { ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { RelativeTime } from '@/components/ui/relative-time';
import { HouseSign } from '@/features/village/components/house-sign';
import { InteriorPlayer } from '@/features/village/components/interior-player';
import {
  AI_ART_PALETTE,
  CAMPFIRE,
  CARPENTER,
  furnitureByName,
  furnitureFor,
  KindBadge,
  LOG_SEAT,
  PixelSprite,
  WINDOW,
} from '@/features/village/components/pixel-sprite';
import {
  backdropFor,
  centerpiece,
  composeScene,
  floorClass,
  heroIndex,
  layoutBuilds,
  pieceScale,
  MAX_ZOOM,
  roomDims,
  SIDEBAR_W,
  sizeScale,
  toBuilds,
  WALL_H,
  wallClass,
  type Build,
} from '@/features/village/room-geometry';
import { useRoomSpec, useTimeWindow, useVillageData, useWorldModel } from '@/features/village/use-village-data';
import { roomFor, type Cell } from '@/features/village/village-model';
import { useVillageUi } from '@/features/village/village-ui-context';
import { cn } from '@/lib/utils';
import type { RoomNote } from '@/types/github';

export function HouseInterior() {
  const { slug, scrub, focusId, setFocusId, aiOn, setAiOn } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = useTimeWindow(payload, scrub);
  const { cells } = useWorldModel(payload, slug, asOf);
  const cell = focusId ? cells.find(c => c.id === focusId) : null;
  const walkTargetRef = useRef<{ x: number; y: number } | null>(null);
  const [viewport, setViewport] = useState({ w: 1400, h: 900 });

  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    walkTargetRef.current = null;
  }, [focusId]);

  if (!cell) return null;

  // No key: switching floors swaps the room content but keeps the scene mounted, so only entering from outside plays the cut.
  return (
    <InteriorScene
      cell={cell}
      ai={aiOn}
      setAiOn={setAiOn}
      setFocusId={setFocusId}
      viewport={viewport}
      walkTargetRef={walkTargetRef}
    />
  );
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
  const roomRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [w, h] = roomDims(cell);
  const scene = useRoomScene(cell, ai, w, h);
  const { spec } = scene;

  // Walking up to a piece (proximity, tracked in the player loop) highlights it and
  // reveals a "look" badge; pressing Enter or clicking that badge opens the close-up.
  // inspectIndex indexes scene.builds.
  const [nearIndex, setNearIndex] = useState<number | null>(null);
  const [inspectIndex, setInspectIndex] = useState<number | null>(null);
  // Mobile-only: the PR sign is a slide-in drawer (desktop keeps it pinned open).
  const [signOpen, setSignOpen] = useState(false);
  const playerPosRef = useRef({ x: w / 2, y: h - 78 });
  const itemsRef = useRef<{ x: number; y: number; index: number }[]>([]);
  const frozenRef = useRef(false);
  const nearRef = useRef<number | null>(null);

  // Furniture positions in room coords (slots are floor-local, offset by WALL_H)
  // for the player's proximity check; refresh whenever the scene reshuffles. The
  // player loop recomputes the nearest index from this list every frame, so a
  // regen that drops a piece self-corrects nearIndex to a valid value or null.
  useEffect(() => {
    itemsRef.current = scene.slots.map((s, i) => ({ x: s.x, y: s.y + WALL_H, index: i }));
  }, [scene.slots]);

  useEffect(() => {
    nearRef.current = nearIndex;
  }, [nearIndex]);

  useEffect(() => {
    frozenRef.current = inspectIndex !== null;
  }, [inspectIndex]);

  // Enter looks at the piece you're standing next to (never while one is open).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && inspectIndex === null && nearRef.current !== null) {
        e.preventDefault();
        setInspectIndex(nearRef.current);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [inspectIndex]);

  // Escape closes the mobile info drawer first if it's open, otherwise leaves
  // the room. (The close-up handles its own Escape in the capture phase.)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (signOpen) setSignOpen(false);
      else setFocusId(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [signOpen, setFocusId]);

  // The room auto-fits; there is no room zoom. Swallow the trackpad pinch
  // (ctrl+wheel) so it can't fall through to the browser and zoom the whole app.
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Fit the room into the space right of the reserved info sidebar: scale it up
  // on small screens so the interior fills the space (never a tiny box lost in
  // the dark) and down when it would overflow, keeping a little breathing room
  // around the edges. The camera centres the room in that remaining region.
  const pad = 32;
  const mobile = viewport.w < 640;
  // Mobile: the sidebar is a hidden drawer, so the room fills the whole screen
  // (cover) and you walk around it — InteriorPlayer's follow-camera pans the
  // overflow. Desktop: fit the entire room into the space beside the sidebar
  // (contain). Must match interior-player's calc so click → room-coords stays true.
  const sidebar = mobile ? 0 : Math.min(SIDEBAR_W, viewport.w * 0.4);
  const availW = viewport.w - sidebar;
  const scale = mobile
    ? Math.min(2, Math.max(availW / w, viewport.h / h))
    : Math.max(0.6, Math.min((availW - pad * 2) / w, (viewport.h - pad * 2) / h, MAX_ZOOM));
  const camX = sidebar + (availW - w * scale) / 2;
  const camY = (viewport.h - h * scale) / 2;

  return (
    <div
      ref={sceneRef}
      className="scene-in absolute inset-0 z-40 overflow-hidden"
      style={{ background: `radial-gradient(ellipse 85% 75% at 50% 42%, ${backdropFor(cell)}, #0c0a08 80%)` }}
    >
      <div
        key={cell.id}
        ref={roomRef}
        className={cn(
          'pixel absolute top-0 left-0 overflow-hidden rounded-sm border-4 border-[#2e2418] shadow-[8px_10px_0_rgb(0_0_0/0.5)] will-change-transform',
          ai && 'ring-4 ring-[#e4c05a]',
        )}
        style={{
          width: w,
          height: h,
          transform: `translate3d(${camX}px, ${camY}px, 0) scale(${scale})`,
          transformOrigin: '0 0',
        }}
        onClick={e => {
          if ((e.target as Element).closest('a, button, [data-stop-walk]')) return;
          const rect = e.currentTarget.getBoundingClientRect();
          // rect is the post-scale border box; divide out the applied scale and
          // drop the 4px border so the click maps to room-local coordinates.
          const s = rect.width / e.currentTarget.offsetWidth;
          walkTargetRef.current = { x: (e.clientX - rect.left) / s - 4, y: (e.clientY - rect.top) / s - 4 };
        }}
      >
        <WallNotes cell={cell} ai={ai} />
        <Floor cell={cell} width={w} height={h} scene={scene} nearIndex={nearIndex} onInspect={setInspectIndex} />
        <Occupants cell={cell} width={w} height={h} />
        <DoorMat width={w} height={h} />
        <InteriorPlayer
          width={w}
          height={h}
          walkTargetRef={walkTargetRef}
          roomRef={roomRef}
          onExit={() => setFocusId(null)}
          playerPosRef={playerPosRef}
          itemsRef={itemsRef}
          onNear={setNearIndex}
          frozenRef={frozenRef}
        />
        {ai ? (
          <span className="font-pixel absolute top-2 left-1/2 z-20 -translate-x-1/2 rounded-sm border-2 border-[#4a3826] bg-[#e4c05a] px-2 py-0.5 text-[11px] font-bold text-[#3a2f22]">
            {spec?.ai ? spec.theme : 'AI at work…'}
          </span>
        ) : null}
      </div>
      {/* Mobile-only: reveal the PR sign drawer. Top-left is empty indoors (HUD
          controls sit top-right, music/help bottom-left). */}
      <button
        type="button"
        onClick={() => setSignOpen(true)}
        aria-label="Show pull request info"
        className="panel font-pixel absolute top-4 left-4 z-50 flex h-9 items-center gap-1.5 rounded-sm px-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 sm:hidden"
      >
        <span aria-hidden>ⓘ</span> info
      </button>
      {signOpen ? (
        <button
          type="button"
          aria-label="Close info panel"
          onClick={() => setSignOpen(false)}
          className="absolute inset-0 z-55 cursor-default bg-black/50 sm:hidden"
        />
      ) : null}
      <HouseSign cell={cell} ai={ai} open={signOpen} onClose={() => setSignOpen(false)} />
      <AiPanel cell={cell} ai={ai} onToggle={setAiOn} />
      {inspectIndex !== null && scene.builds[inspectIndex] ? (
        <FurnitureCloseup
          build={scene.builds[inspectIndex]}
          spec={spec}
          cell={cell}
          onClose={() => setInspectIndex(null)}
        />
      ) : null}
    </div>
  );
}

function AiPanel({ cell, ai, onToggle }: { cell: Cell; ai: boolean; onToggle: (on: boolean) => void }) {
  const { slug } = useVillageUi();
  const { spec, loading } = useRoomSpec(slug, cell.id, ai);
  const working = ai && loading;
  if (!working && !(spec?.aiAvailable && spec.commits.length > 0)) return null;

  // The explanation stays visible in every state (off / building / on) and the
  // panel keeps a fixed width so toggling never resizes or empties it out.
  const status = working
    ? 'Building this room from its commits…'
    : ai
      ? spec?.ai
        ? `Showing “${spec.theme}”`
        : 'Showing the AI-built scene'
      : 'Redraw this room from its real commits as an invented scene.';

  return (
    <aside className="absolute right-4 bottom-4 z-50 w-44">
      <button
        onClick={() => onToggle(!ai)}
        role="switch"
        aria-checked={ai}
        aria-label="Visualize this room with AI"
        className={cn(
          'panel pixel flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-sm p-3 transition-transform hover:-translate-y-0.5',
          ai && 'ring-2 ring-[#e4c05a]',
        )}
      >
        <span className="relative">
          {working ? (
            <span aria-hidden className="absolute -top-1 -right-2">
              {[0, 1].map(i => (
                <span
                  key={i}
                  className="smoke-puff absolute h-1.5 w-1.5 rounded-full bg-[#d8c9a8]"
                  style={{ animationDelay: `${i * 800}ms` }}
                />
              ))}
            </span>
          ) : null}
          <span className={cn('block', working && 'sprite-bob')}>
            <PixelSprite art={CARPENTER.art} palette={CARPENTER.palette} scale={3} />
          </span>
        </span>
        <span className="font-pixel text-[12px] font-bold text-[#3a2f22]">Draw with AI</span>
        <span className="flex min-h-9 items-center text-center text-[10px] leading-tight text-[#6b5b43]">{status}</span>
        <span
          aria-hidden
          className={cn(
            'flex h-4 w-8 items-center rounded-sm border-2 border-[#4a3826] px-0.5 transition-colors',
            ai ? 'justify-end bg-[#e4c05a]' : 'justify-start bg-[#b5a687]',
          )}
        >
          <span className="h-2 w-2.5 rounded-xs border border-[#4a3826] bg-[#f7efdc]" />
        </span>
      </button>
    </aside>
  );
}

function WallNotes({ cell, ai }: { cell: Cell; ai: boolean }) {
  const { slug, scrub } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = useTimeWindow(payload, scrub);
  const { cells } = useWorldModel(payload, slug, asOf);
  const { spec, loading } = useRoomSpec(slug, cell.id, ai);
  const outdoors = cell.kind === 'issue' || cell.kind === 'inbox';

  const notes: RoomNote[] = spec?.notes.length
    ? spec.notes
    : roomFor(payload, cells, cell.id).notes.map(e => ({
        id: e.id,
        author: e.actor,
        avatar: e.avatar,
        body: e.body ?? '',
        at: e.at,
        url: e.url,
      }));

  if (loading && !spec) return <WallSkeleton />;

  return (
    <div className={cn('absolute inset-x-0 top-0', wallClass(cell))} style={{ height: WALL_H }}>
      {!outdoors ? (
        <>
          <span className="pixel absolute top-6 left-8">
            <PixelSprite art={WINDOW.art} palette={WINDOW.palette} scale={8} className="dark:hidden" />
            <PixelSprite
              art={WINDOW.art}
              palette={{ ...WINDOW.palette, b: WINDOW.palette.n }}
              scale={8}
              className="hidden dark:block"
            />
          </span>
          <span className="pixel absolute top-6 right-8">
            <PixelSprite art={WINDOW.art} palette={WINDOW.palette} scale={8} className="dark:hidden" />
            <PixelSprite
              art={WINDOW.art}
              palette={{ ...WINDOW.palette, b: WINDOW.palette.n }}
              scale={8}
              className="hidden dark:block"
            />
          </span>
        </>
      ) : null}

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
    </div>
  );
}

// Everything needed to render (and reason about) the room's furniture, computed
// once so the floor, the proximity check, and the close-up all agree on indices.
type Scene = {
  spec: ReturnType<typeof useRoomSpec>['spec'];
  loading: boolean;
  campsite: boolean;
  builds: Build[];
  slots: { x: number; y: number }[];
  hero: number;
  anchor: ReturnType<typeof centerpiece>;
};

function useRoomScene(cell: Cell, ai: boolean, width: number, height: number): Scene {
  const { slug } = useVillageUi();
  const { spec, loading } = useRoomSpec(slug, cell.id, ai);
  const campsite = cell.kind === 'issue';
  const plaza = cell.kind === 'inbox';
  const commits = campsite || plaza ? [] : (spec?.commits ?? []);

  const floorH = height - WALL_H;
  // keepPreviousData holds the prior furniture on screen while a regen loads, so
  // the room never blanks; the "AI at work…" badge signals the swap in progress.
  const builds = toBuilds(commits, spec?.items);
  // An AI scene draws its own hero contraption, composed as a diorama; plain rooms
  // scatter furniture around the anchor. Either way the room keeps its generic
  // centrepiece artwork (well/table/…) — in AI rooms it sits behind the diorama
  // (zIndex 1) as the room's own backdrop rather than being replaced by it.
  const aiScene = builds.some(b => Boolean(b.pieces?.length));
  const hero = aiScene ? heroIndex(builds) : -1;
  const anchor = campsite ? null : centerpiece(cell);
  const slots = aiScene ? composeScene(builds, width, floorH, hero) : layoutBuilds(builds, width, floorH);

  return { spec, loading, campsite, builds, slots, hero, anchor };
}

function Floor({
  cell,
  width,
  height,
  scene,
  nearIndex,
  onInspect,
}: {
  cell: Cell;
  width: number;
  height: number;
  scene: Scene;
  nearIndex: number | null;
  onInspect: (index: number) => void;
}) {
  const { spec, loading, campsite, builds, slots, anchor } = scene;
  if (loading && !spec) return <FloorSkeleton />;

  const floorH = height - WALL_H;

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
        <Furniture
          key={build.commits[0].sha}
          build={build}
          x={slots[i].x}
          y={slots[i].y}
          delay={i * 90}
          near={i === nearIndex}
          onInspect={() => onInspect(i)}
        />
      ))}
    </div>
  );
}

function Campsite({ width, height }: { width: number; height: number }) {
  return (
    <>
      <span
        className="pixel absolute"
        style={{ left: width / 2, top: height / 2 - 20, transform: 'translate(-50%, -50%)' }}
      >
        <PixelSprite art={CAMPFIRE.art} palette={CAMPFIRE.palette} scale={7} />
      </span>
      {[
        { x: width / 2 - 130, y: height / 2 - 30, rot: 90 },
        { x: width / 2 + 130, y: height / 2 - 30, rot: 90 },
        { x: width / 2, y: height / 2 + 80, rot: 0 },
      ].map((s, i) => (
        <span
          key={i}
          className="pixel absolute"
          style={{ left: s.x, top: s.y, transform: `translate(-50%, -50%) rotate(${s.rot}deg)` }}
        >
          <PixelSprite art={LOG_SEAT.art} palette={LOG_SEAT.palette} scale={5} />
        </span>
      ))}
    </>
  );
}

function Furniture({
  build,
  x,
  y,
  delay = 0,
  near,
  onInspect,
}: {
  build: Build;
  x: number;
  y: number;
  delay?: number;
  near: boolean;
  onInspect: () => void;
}) {
  const { setTip } = useVillageUi();
  const fallback = (build.kind ? furnitureByName(build.kind) : null) ?? furnitureFor(build.commits[0].sha);
  const name = build.name ?? fallback.name;
  const drawn = Boolean(build.pieces?.length);
  // Hovering surfaces the real commit info without opening the close-up: a single
  // commit's full message, or each commit's summary line for a grouped piece.
  const tipBody =
    build.commits.length === 1
      ? build.commits[0].message
      : build.commits.map(c => `• ${c.message.split('\n')[0]}`).join('\n');

  return (
    <div
      className="absolute flex flex-col items-center transition-[translate] duration-150 will-change-transform hover:-translate-y-1.5"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: Math.round(y) }}
    >
      {/* Clicking a sprite jumps straight to its commit on GitHub; the "look" badge
          (or Enter, when you're standing next to it) opens the close-up — clickable
          too, so it works without a keyboard. data-stop-walk keeps the room's
          click-to-walk from firing under any of it. */}
      <div
        data-stop-walk
        onMouseMove={e =>
          setTip({ x: e.clientX, y: e.clientY, title: name, body: tipBody, when: build.commits[0].at || null })
        }
        onMouseLeave={() => setTip(null)}
        className="pop-in flex flex-col items-center"
        style={{ animationDelay: `${delay}ms` }}
      >
        <button
          type="button"
          data-stop-walk
          onClick={onInspect}
          aria-label={`Look closer at ${name}`}
          className={cn(
            'font-pixel mb-1 cursor-pointer rounded-sm border-2 border-[#4a3826] bg-[#e4c05a] px-1.5 py-0.5 text-[10px] font-bold text-[#3a2f22] shadow transition-opacity',
            near ? 'animate-bounce opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          ⏎ look
        </button>
        <span className={cn('flex items-end rounded-sm', near && 'ring-2 ring-[#e4c05a]')}>
          {build.commits.map((commit, i) => {
            const piece = drawn ? (build.pieces![i] ?? build.pieces![build.pieces!.length - 1]) : fallback.art;
            const palette = drawn ? AI_ART_PALETTE : fallback.palette;
            return (
              <a
                key={commit.sha}
                href={commit.url}
                target="_blank"
                rel="noreferrer"
                data-stop-walk
                aria-label={`View commit: ${commit.message.split('\n')[0]}`}
                className="cursor-pointer"
                style={drawn ? undefined : { marginLeft: i === 0 ? 0 : -6, translate: `0 ${(i % 2) * 4}px` }}
              >
                <PixelSprite art={piece} palette={palette} scale={drawn ? pieceScale(build) : sizeScale(commit)} />
              </a>
            );
          })}
        </span>
        <span aria-hidden className="mt-0.5 block h-1 w-7 rounded-full bg-black/30" />
        <span className="font-pixel mt-0.5 block max-w-28 truncate rounded-sm bg-black/45 px-1 text-[11px] leading-4 text-white/90">
          {name}
        </span>
      </div>
    </div>
  );
}

// The first-person close-up (opened by walking up and pressing Enter): the object
// enlarged on a soft vignette of the room's own colour, with the commit(s) it stands
// for and links to each. Esc (captured, so it beats the room-exit Esc) or the
// backdrop closes it.
function FurnitureCloseup({
  build,
  spec,
  cell,
  onClose,
}: {
  build: Build;
  spec: Scene['spec'];
  cell: Cell;
  onClose: () => void;
}) {
  const fallback = (build.kind ? furnitureByName(build.kind) : null) ?? furnitureFor(build.commits[0].sha);
  const name = build.name ?? fallback.name;
  const drawn = Boolean(build.pieces?.length);
  const MAG = 2.4;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-60 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[3px]"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <aside className="pixel relative flex max-h-[88dvh] w-160 max-w-[92vw] flex-col overflow-hidden rounded-sm border-4 border-[#2e2418] bg-[#221a12]/95 text-[#f0e6d2] shadow-[8px_10px_0_rgb(0_0_0/0.5)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to the room (Esc)"
          className="font-pixel absolute top-2 right-2 z-10 cursor-pointer text-[18px] font-bold text-[#e0d3b8] transition-colors hover:text-white"
        >
          ✕
        </button>
        <div
          className="flex shrink-0 flex-col items-center gap-3 px-6 pt-10 pb-5"
          style={{ background: `radial-gradient(ellipse 75% 80% at 50% 45%, ${backdropFor(cell)}, transparent 75%)` }}
        >
          <div className="flex items-end">
            {build.commits.map((commit, i) => {
              const piece = drawn ? (build.pieces![i] ?? build.pieces![build.pieces!.length - 1]) : fallback.art;
              const palette = drawn ? AI_ART_PALETTE : fallback.palette;
              const scale = (drawn ? pieceScale(build) : sizeScale(commit)) * MAG;
              return (
                <span key={commit.sha} style={drawn ? undefined : { marginLeft: i === 0 ? 0 : -10 }}>
                  <PixelSprite art={piece} palette={palette} scale={scale} />
                </span>
              );
            })}
          </div>
          <span aria-hidden className="block h-1.5 w-16 rounded-full bg-black/40 blur-[1px]" />
          <div className="flex flex-col items-center gap-1.5">
            <p className="font-pixel text-center text-[18px] font-bold drop-shadow-[0_2px_0_rgb(0_0_0/0.5)]">{name}</p>
            {spec?.ai ? (
              <span className="font-pixel rounded-sm border-2 border-[#4a3826] bg-[#e4c05a] px-2 py-0.5 text-[11px] font-bold text-[#3a2f22]">
                {spec.theme}
              </span>
            ) : null}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto border-t-2 border-[#f0e6d2]/15 px-6 py-4">
          <p className="font-pixel mb-2.5 text-[11px] tracking-wide text-[#9a8c6d] uppercase">
            {build.commits.length > 1 ? `Built from ${build.commits.length} commits` : 'From this commit'}
          </p>
          <ul className="flex flex-col gap-2">
            {build.commits.map(commit => (
              <li key={commit.sha}>
                <a
                  href={commit.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col gap-1 rounded-xs border-2 border-[#f0e6d2]/15 bg-black/20 px-3 py-2.5 transition-colors hover:border-[#f0e6d2]/40"
                >
                  <span className="text-[14px] leading-snug wrap-anywhere whitespace-pre-wrap text-[#e4d7ba]">
                    {commit.message}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-[#9a8c6d]">
                    <span className="font-bold text-[#d8b24a]">{commit.author}</span>
                    <RelativeTime date={commit.at} />
                    <span className="font-pixel ml-auto flex items-center gap-1 text-[#f0b98a] opacity-0 transition-opacity group-hover:opacity-100">
                      view commit <ArrowUpRight size={12} strokeWidth={3} />
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>
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
        const ring = Math.floor(i / 10);
        const inRing = Math.min(10, here.length - ring * 10);
        const angle = ((i % 10) / inRing) * Math.PI * 2 - Math.PI / 2;
        const x = width / 2 + Math.cos(angle) * (Math.min(200, width / 2 - 90) + ring * 55);
        const y =
          WALL_H +
          (height - WALL_H) / 2 -
          20 +
          Math.sin(angle) * (Math.min(120, (height - WALL_H) / 2 - 70) + ring * 26);
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
                <img
                  src={`${a.avatar}?size=64`}
                  alt={a.login}
                  width={30}
                  height={30}
                  className="rounded-sm border-2 border-[#2e2418] shadow"
                />
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
    <div
      aria-hidden
      className="pointer-events-none absolute flex flex-col items-center"
      style={{ left: width / 2, top: height - 4, transform: 'translate(-50%, -100%)', zIndex: 5 }}
    >
      <span className="h-14 w-40 rounded-t-md border-4 border-b-0 border-[#4a3826] bg-[#8a5a33] shadow-[inset_0_4px_0_rgb(255_255_255/0.18)]" />
      <span className="font-pixel -mt-11 mb-2 flex items-center gap-1 text-base font-bold text-[#f0e6d2] drop-shadow-[0_1px_0_rgb(0_0_0/0.5)]">
        walk out ↓
      </span>
    </div>
  );
}

function StickyNote({ note, tilt }: { note: RoomNote; tilt: number }) {
  const { setTip } = useVillageUi();
  return (
    <a
      href={note.url ?? undefined}
      target="_blank"
      rel="noreferrer"
      data-stop-walk
      className="sticky-note relative h-28 w-28 shrink-0 p-2 pb-4 text-left transition-transform hover:-translate-y-1"
      style={{ rotate: `${tilt}deg` }}
      onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, title: note.author, body: note.body, when: note.at })}
      onMouseLeave={() => setTip(null)}
      aria-label={`Note from ${note.author}`}
    >
      {note.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${note.avatar}?size=32`}
          alt=""
          width={15}
          height={15}
          className="absolute top-1.5 right-1.5 rounded-full border border-black/30"
        />
      ) : null}
      {/* line-clamp sets display; a `block` here would override it and spill the note text. */}
      <span className="line-clamp-4 font-mono text-[10px] leading-[1.4] wrap-break-word text-[#5a4a1e]">
        {note.body}
      </span>
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
      <p className="font-pixel absolute top-1/2 left-1/2 -translate-1/2 text-[13px] text-[#f0e6d2]/50">
        stepping inside…
      </p>
    </div>
  );
}
