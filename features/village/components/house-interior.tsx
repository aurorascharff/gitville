'use client';

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
  floorClass,
  layoutBuilds,
  pieceScale,
  roomDims,
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
    if (!cell) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFocusId(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cell, setFocusId]);

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
  const { slug } = useVillageUi();
  const { spec } = useRoomSpec(slug, cell.id, ai);
  const roomRef = useRef<HTMLDivElement>(null);
  const [w, h] = roomDims(cell);
  const camX = w <= viewport.w ? (viewport.w - w) / 2 : Math.min(0, Math.max(viewport.w - w, viewport.w / 2 - w / 2));
  const camY =
    h <= viewport.h ? (viewport.h - h) / 2 : Math.min(0, Math.max(viewport.h - h, viewport.h / 2 - (h - 78)));

  return (
    <div
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
        style={{ width: w, height: h, transform: `translate3d(${camX}px, ${camY}px, 0)` }}
        onClick={e => {
          if ((e.target as Element).closest('a, button, [data-stop-walk]')) return;
          const rect = e.currentTarget.getBoundingClientRect();
          walkTargetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }}
      >
        <WallNotes cell={cell} ai={ai} />
        <Floor cell={cell} width={w} height={h} ai={ai} />
        <Occupants cell={cell} width={w} height={h} />
        <DoorMat width={w} height={h} />
        <InteriorPlayer
          width={w}
          height={h}
          walkTargetRef={walkTargetRef}
          roomRef={roomRef}
          onExit={() => setFocusId(null)}
        />
        {ai ? (
          <span className="font-pixel absolute top-2 left-1/2 z-20 -translate-x-1/2 rounded-sm border-2 border-[#4a3826] bg-[#e4c05a] px-2 py-0.5 text-[11px] font-bold text-[#3a2f22]">
            {spec?.ai ? spec.theme : 'AI at work…'}
          </span>
        ) : null}
      </div>
      <HouseSign cell={cell} />
      <AiPanel cell={cell} ai={ai} onToggle={setAiOn} />
    </div>
  );
}

function AiPanel({ cell, ai, onToggle }: { cell: Cell; ai: boolean; onToggle: (on: boolean) => void }) {
  const { slug, setTip } = useVillageUi();
  const { spec, loading } = useRoomSpec(slug, cell.id, ai);
  const working = ai && loading;
  if (!working && !(spec?.aiAvailable && spec.commits.length > 0)) return null;

  const label = working ? 'at work…' : ai ? 'AI room' : 'visualize with AI';

  return (
    <aside className="absolute top-4 right-4 z-50">
      <button
        onClick={() => onToggle(!ai)}
        role="switch"
        aria-checked={ai}
        aria-label="Visualize this room with AI"
        onMouseMove={e =>
          setTip({
            x: e.clientX,
            y: e.clientY,
            title: label,
            body: !working && spec?.ai ? spec.theme : null,
            when: null,
          })
        }
        onMouseLeave={() => setTip(null)}
        className={cn(
          'panel pixel flex cursor-pointer flex-col items-center rounded-sm p-2 transition-transform hover:-translate-y-0.5',
          ai && 'ring-2 ring-[#e4c05a]',
          !ai && !working && 'opacity-80',
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
        <span
          aria-hidden
          className={cn(
            'mt-1.5 flex h-4 w-8 items-center rounded-sm border-2 border-[#4a3826] px-0.5 transition-colors',
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

function Floor({ cell, width, height, ai }: { cell: Cell; width: number; height: number; ai: boolean }) {
  const { slug } = useVillageUi();
  const { spec, loading } = useRoomSpec(slug, cell.id, ai);
  const campsite = cell.kind === 'issue';
  const plaza = cell.kind === 'inbox';
  const commits = campsite || plaza ? [] : (spec?.commits ?? []);

  if (loading && !spec) return <FloorSkeleton />;
  const redecorating = loading && Boolean(spec) && (spec?.ai ?? false) !== ai;

  const anchor = campsite ? null : centerpiece(cell);
  const floorH = height - WALL_H;
  const builds = redecorating ? [] : toBuilds(commits, spec?.items);
  const slots = layoutBuilds(builds, width, floorH);

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

function Furniture({ build, x, y, delay = 0 }: { build: Build; x: number; y: number; delay?: number }) {
  const { setTip } = useVillageUi();
  const fallback = (build.kind ? furnitureByName(build.kind) : null) ?? furnitureFor(build.commits[0].sha);
  const name = build.name ?? fallback.name;
  const drawn = Boolean(build.pieces?.length);

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: Math.round(y) }}
    >
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
                  setTip({
                    x: e.clientX,
                    y: e.clientY,
                    title: `${name} by ${commit.author}`,
                    body: commit.message,
                    when: commit.at || null,
                  })
                }
                onMouseLeave={() => setTip(null)}
              >
                <PixelSprite art={piece} palette={palette} scale={drawn ? pieceScale(build) : sizeScale(commit)} />
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
      <span className="h-7 w-20 rounded-t-sm border-2 border-b-0 border-[#4a3826] bg-[#8a5a33] shadow-[inset_0_3px_0_rgb(255_255_255/0.15)]" />
      <span className="font-pixel -mt-6 mb-1 text-[10px] text-[#f0e6d2]/90">walk out</span>
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
