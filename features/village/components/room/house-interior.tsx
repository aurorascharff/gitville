'use client';

import { useEffect, useRef, useState } from 'react';
import { AvatarImage } from '@/components/ui/avatar-image';
import { RelativeTime } from '@/components/ui/relative-time';
import { AiPanel } from '@/features/village/components/room/ai-panel';
import { FurnitureCloseup } from '@/features/village/components/room/furniture-closeup';
import { HouseSign } from '@/features/village/components/room/house-sign';
import { InteriorPlayer } from '@/features/village/components/room/interior-player';
import { RoomOccupants } from '@/features/village/components/room/room-occupants';
import {
  AI_ART_PALETTE,
  CAMPFIRE,
  furnitureByName,
  furnitureFor,
  LOG_SEAT,
  PixelSprite,
  sizedFurnitureArt,
  WINDOW,
} from '@/features/village/components/shared/pixel-sprite';
import { useRoomAi } from '@/features/village/hooks/use-room-ai';
import { useViewport, type Viewport } from '@/features/village/hooks/use-viewport';
import { useRoomSpec, useVillageData } from '@/features/village/hooks/use-village-data';
import { useVillageUi } from '@/features/village/providers/village-ui-provider';
import {
  backdropFor,
  buildSize,
  centerpiece,
  composeScene,
  floorClass,
  heroIndex,
  layoutBuilds,
  pieceScale,
  roomFrame,
  roomDims,
  toBuilds,
  WALL_H,
  wallClass,
  type Build,
} from '@/features/village/utils/room-geometry';
import { roomFor, timeWindowFor, worldModelFor, type Cell } from '@/features/village/utils/village-model';
import { cn } from '@/lib/utils';
import type { RoomNote } from '@/types/github';

export function HouseInterior() {
  const { slug, scrub, focusId, setFocusId, aiOn, setAiOn, setAiRoomDecor } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = timeWindowFor(payload, scrub);
  const { cells } = worldModelFor(payload, slug, asOf);
  const cell = focusId ? cells.find(c => c.id === focusId) : null;
  const walkTargetRef = useRef<{ x: number; y: number } | null>(null);
  const viewport = useViewport();

  useEffect(() => {
    walkTargetRef.current = null;
  }, [focusId]);

  if (!cell || !viewport.ready) return null;

  return (
    <InteriorScene
      key={cell.id}
      cell={cell}
      ai={aiOn}
      setAiOn={setAiOn}
      setAiRoomDecor={setAiRoomDecor}
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
  setAiRoomDecor,
  setFocusId,
  viewport,
  walkTargetRef,
}: {
  cell: Cell;
  ai: boolean;
  setAiOn: (on: boolean) => void;
  setAiRoomDecor: (cellId: string, decor: { theme: string; title: string | null }) => void;
  setFocusId: (id: string | null) => void;
  viewport: Viewport;
  walkTargetRef: React.RefObject<{ x: number; y: number } | null>;
}) {
  const roomRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [w, h] = roomDims(cell);
  const scene = useRoomScene(cell, ai, w, h);
  const { spec } = scene;
  const roomAi = useRoomAi(cell, ai, setAiOn);
  const aiWorking = scene.aiPending || roomAi.pending;

  const [nearIndex, setNearIndex] = useState<number | null>(null);
  const [inspectIndex, setInspectIndex] = useState<number | null>(null);
  const [signOpen, setSignOpen] = useState(false);
  const playerPosRef = useRef({ x: w / 2, y: h - 78 });
  const itemsRef = useRef<{ x: number; y: number; index: number }[]>([]);
  const frozenRef = useRef(false);
  const nearRef = useRef<number | null>(null);

  useEffect(() => {
    itemsRef.current = scene.slots.map((s, i) => ({ x: s.x, y: s.y + WALL_H, index: i }));
  }, [scene.slots]);

  useEffect(() => {
    nearRef.current = nearIndex;
  }, [nearIndex]);

  useEffect(() => {
    frozenRef.current = inspectIndex !== null;
  }, [inspectIndex]);

  useEffect(() => {
    if (!ai || !spec?.ai) return;
    setAiRoomDecor(cell.id, { theme: spec.theme, title: spec.title ?? cell.sub ?? null });
  }, [ai, cell.id, cell.sub, spec?.ai, spec?.theme, spec?.title, setAiRoomDecor]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, button, a')) return;
      const key = e.key.toLowerCase();
      if (key === 'i') {
        e.preventDefault();
        setSignOpen(open => !open);
      }
      if (key === 'g' && (scene.spec?.aiAvailable || aiWorking)) {
        e.preventDefault();
        if (!ai) roomAi.generate();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ai, aiWorking, roomAi, scene.spec?.aiAvailable]);

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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (signOpen) setSignOpen(false);
      else setFocusId(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [signOpen, setFocusId]);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const frame = roomFrame(viewport.w, viewport.h, w, h);

  return (
    <div
      ref={sceneRef}
      className="absolute inset-0 z-40 touch-none overflow-hidden"
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
          width: `${w}px`,
          height: `${h}px`,
          transform: `translate3d(${frame.x}px, ${frame.y}px, 0) scale(${frame.scale})`,
          transformOrigin: '0 0',
        }}
        onClick={e => {
          if ((e.target as Element).closest('a, button, [data-stop-walk]')) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const s = rect.width / e.currentTarget.offsetWidth;
          walkTargetRef.current = { x: (e.clientX - rect.left) / s - 4, y: (e.clientY - rect.top) / s - 4 };
        }}
      >
        <WallNotes cell={cell} ai={ai} />
        <Floor cell={cell} width={w} height={h} scene={scene} nearIndex={nearIndex} onInspect={setInspectIndex} />
        <RoomOccupants cell={cell} width={w} height={h} />
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
        {ai && (spec?.ai || aiWorking) ? (
          <span className="font-pixel absolute top-2 left-1/2 z-20 -translate-x-1/2 rounded-sm border-2 border-[#4a3826] bg-[#e4c05a] px-2 py-0.5 text-[11px] font-bold text-[#3a2f22]">
            {spec?.ai ? 'furniture fixed' : 'carpenter fixing...'}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => setSignOpen(true)}
        aria-keyshortcuts="I"
        aria-label="Show pull request info"
        className="panel absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 z-50 flex h-9 w-9 items-center justify-center rounded-sm text-[16px] font-bold transition-transform hover:-translate-y-0.5 sm:hidden"
      >
        <span aria-hidden>ⓘ</span>
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
      <AiPanel ai={ai} onGenerate={roomAi.generate} pending={aiWorking} spec={spec} />
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

function WallNotes({ cell, ai }: { cell: Cell; ai: boolean }) {
  const { slug, scrub } = useVillageUi();
  const { payload } = useVillageData(slug);
  const { asOf } = timeWindowFor(payload, scrub);
  const { cells } = worldModelFor(payload, slug, asOf);
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

  if (loading && !spec) return <WallSkeleton cell={cell} />;

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

type Scene = {
  spec: ReturnType<typeof useRoomSpec>['spec'];
  loading: boolean;
  aiPending: boolean;
  campsite: boolean;
  builds: Build[];
  slots: { x: number; y: number }[];
  hero: number;
  anchor: ReturnType<typeof centerpiece>;
};

function useRoomScene(cell: Cell, ai: boolean, width: number, height: number): Scene {
  const { slug } = useVillageUi();
  const { spec, loading, aiPending } = useRoomSpec(slug, cell.id, ai);
  const campsite = cell.kind === 'issue';
  const plaza = cell.kind === 'inbox';
  const commits = campsite || plaza ? [] : (spec?.commits ?? []);

  const floorH = height - WALL_H;
  const builds = toBuilds(commits, spec?.items);
  const aiScene = builds.some(b => Boolean(b.pieces?.length));
  const hero = aiScene ? heroIndex(builds) : -1;
  const anchor = campsite ? null : centerpiece(cell);
  const slots = aiScene ? composeScene(builds, width, floorH, hero) : layoutBuilds(builds, width, floorH);

  return { spec, loading, aiPending, campsite, builds, slots, hero, anchor };
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
  if (loading && !spec) return <FloorSkeleton cell={cell} />;

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
  const art = drawn ? build.pieces![0] : sizedFurnitureArt(fallback, buildSize(build));
  const palette = drawn ? AI_ART_PALETTE : fallback.palette;
  const firstCommit = build.commits[0];
  const tipBody =
    build.commits.length === 1 && !drawn
      ? `${firstCommit.message}\nby ${firstCommit.author}`
      : [
          `${build.commits.length} ${build.commits.length === 1 ? 'commit' : 'commits'} built this ${name}`,
          ...build.commits.map(c => `• ${c.message.split('\n')[0]} — ${c.author}`),
        ].join('\n');

  return (
    <div
      className="absolute flex flex-col items-center transition-[translate] duration-150 will-change-transform hover:-translate-y-1.5"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: Math.round(y) }}
    >
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
          tabIndex={-1}
          data-stop-walk
          onClick={onInspect}
          aria-label={`Look closer at ${name}`}
          className={cn(
            'font-pixel mb-1 cursor-pointer rounded-sm border-2 border-[#4a3826] bg-[#e4c05a] px-2 py-0.5 text-[11px] font-bold text-[#3a2f22] shadow transition-opacity',
            near ? 'animate-bounce opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          ⏎ look
        </button>
        <span className={cn('flex items-end rounded-sm', near && 'ring-2 ring-[#e4c05a]')}>
          <a
            href={firstCommit.url}
            target="_blank"
            rel="noreferrer"
            tabIndex={-1}
            data-stop-walk
            aria-label={`View commit: ${firstCommit.message.split('\n')[0]}`}
            className="flex cursor-pointer flex-col items-center"
          >
            <PixelSprite art={art} palette={palette} scale={pieceScale(build)} />
          </a>
        </span>
        <span aria-hidden className="mt-0.5 block h-1 w-7 rounded-full bg-black/30" />
        <span className="font-pixel mt-1 block max-w-36 truncate rounded-sm bg-black/50 px-1.5 text-[12px] leading-5 text-white/95">
          {name}
        </span>
      </div>
    </div>
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
      <span className="font-pixel -mt-11 mb-2 text-[22px] leading-none font-bold text-[#f0e6d2] drop-shadow-[0_1px_0_rgb(0_0_0/0.5)]">
        ↓
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
      tabIndex={-1}
      data-stop-walk
      className="sticky-note relative h-28 w-28 shrink-0 p-2 pb-4 text-left transition-transform hover:-translate-y-1"
      style={{ rotate: `${tilt}deg` }}
      onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, title: note.author, body: note.body, when: note.at })}
      onMouseLeave={() => setTip(null)}
      aria-label={`Note from ${note.author}`}
    >
      {note.avatar ? (
        <AvatarImage
          src={`${note.avatar}?size=32`}
          name={note.author}
          alt=""
          size={15}
          className="absolute top-1.5 right-1.5 rounded-full border border-black/30"
        />
      ) : null}
      <span className="line-clamp-4 font-mono text-[10px] leading-[1.4] wrap-break-word text-[#5a4a1e]">
        {note.body}
      </span>
      <span className="absolute bottom-1 left-2 font-mono text-[8px] font-bold text-[#8a6d2a]">
        <RelativeTime date={note.at} />
      </span>
    </a>
  );
}

function WallSkeleton({ cell }: { cell: Cell }) {
  return <div aria-hidden className={cn('absolute inset-x-0 top-0', wallClass(cell))} style={{ height: WALL_H }} />;
}

function FloorSkeleton({ cell }: { cell: Cell }) {
  return (
    <div className={cn('absolute inset-x-0 bottom-0', floorClass(cell))} style={{ top: WALL_H }}>
      <p className="font-pixel absolute top-1/2 left-1/2 -translate-1/2 text-[13px] text-[#f0e6d2]/50">
        stepping inside…
      </p>
    </div>
  );
}
