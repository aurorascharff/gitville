'use client';

import { useEffect, useRef } from 'react';
import { useVillageUi } from '@/features/village/providers/village-ui-provider';
import { WORLD_H, WORLD_W, type Cell } from '@/features/village/utils/village-model';

type TravelDetail = { x: number; y: number; cellId?: string };

export function travelTo(detail: TravelDetail) {
  window.dispatchEvent(new CustomEvent<TravelDetail>('gv:travel', { detail }));
}

const SPEED = 4.4;
const ZOOM_MAX = 1.3;

function coverZoom(): number {
  if (typeof window === 'undefined') return 1;
  return Math.max(window.innerWidth / WORLD_W, window.innerHeight / WORLD_H);
}

export function clampZoom(z: number): number {
  const lo = coverZoom();
  return Math.min(Math.max(ZOOM_MAX, lo), Math.max(lo, z));
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

export function Player({ cells, worldRef }: { cells: Cell[]; worldRef: React.RefObject<HTMLDivElement | null> }) {
  const { focusId, setFocusId, zoom, setZoom } = useVillageUi();
  const zoomRef = useRef(zoom);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const reclamp = () => setZoom(z => clampZoom(z));
    reclamp();
    window.addEventListener('resize', reclamp);
    return () => window.removeEventListener('resize', reclamp);
  }, [setZoom]);
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const st = useRef({
    x: WORLD_W / 2,
    y: WORLD_H / 2 + 170,
    tx: WORLD_W / 2,
    ty: WORLD_H / 2 + 170,
    camX: Number.NaN,
    camY: Number.NaN,
    camZ: 1,
    pending: null as string | null,
    keys: new Set<string>(),
    dir: 1,
    follow: true,
    anchor: null as { sx: number; sy: number } | null,
  });
  const paused = useRef(false);
  const cellsRef = useRef(cells);

  useEffect(() => {
    paused.current = Boolean(focusId);
  }, [focusId]);

  useEffect(() => {
    cellsRef.current = cells;
  }, [cells]);

  useEffect(() => {
    const s = st.current;

    function onTravel(e: Event) {
      const d = (e as CustomEvent<TravelDetail>).detail;
      s.tx = d.x;
      s.ty = d.y;
      s.pending = d.cellId ?? null;
      s.follow = true;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (isTyping(e.target)) return;
      const k = e.key.toLowerCase();
      if ((k === '+' || k === '=' || k === '-') && !paused.current) {
        e.preventDefault();
        setZoom(z => clampZoom(Math.round((z + (k === '-' ? -0.15 : 0.15)) * 100) / 100));
        s.follow = true;
      }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
        if (paused.current) return;
        e.preventDefault();
        s.keys.add(k);
        s.pending = null;
        s.tx = s.x;
        s.ty = s.y;
        s.follow = true;
      }
      if (k === 'enter' && !paused.current) {
        const near = cellsRef.current
          .map(c => ({ c, d: Math.hypot(c.x - s.x, c.y - s.y) }))
          .sort((a, b) => a.d - b.d)[0];
        if (near && near.d < 150) setFocusId(near.c.id);
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      s.keys.delete(e.key.toLowerCase());
    }
    function onWheel(e: WheelEvent) {
      if (paused.current || Number.isNaN(s.camX)) return;
      e.preventDefault();
      s.follow = false;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      if (e.ctrlKey) {
        const next = clampZoom(zoomRef.current * Math.exp(-e.deltaY * 0.01));
        s.anchor = { sx, sy };
        zoomRef.current = next;
        setZoom(() => next);
      } else {
        s.anchor = null;
        s.camX -= e.deltaX;
        s.camY -= e.deltaY;
      }
    }

    const stage = worldRef.current?.parentElement;
    window.addEventListener('gv:travel', onTravel);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    stage?.addEventListener('wheel', onWheel, { passive: false });

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);

      if (worldRef.current) {
        const z = zoomRef.current;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const prevZ = Number.isNaN(s.camZ) ? z : s.camZ;
        s.camZ = prevZ + (z - prevZ) * 0.12;
        const ww = WORLD_W * s.camZ;
        const wh = WORLD_H * s.camZ;
        const clampX = (cx: number) => (ww <= vw ? (vw - ww) / 2 : Math.min(0, Math.max(vw - ww, cx)));
        const clampY = (cy: number) => (wh <= vh ? (vh - wh) / 2 : Math.min(0, Math.max(vh - wh, cy)));
        if (s.follow) {
          const targetX = clampX(vw / 2 - s.x * s.camZ);
          const targetY = clampY(vh / 2 - s.y * s.camZ);
          if (Number.isNaN(s.camX)) {
            s.camX = targetX;
            s.camY = targetY;
          } else {
            s.camX += (targetX - s.camX) * 0.12;
            s.camY += (targetY - s.camY) * 0.12;
          }
        } else {
          const ax = s.anchor?.sx ?? vw / 2;
          const ay = s.anchor?.sy ?? vh / 2;
          s.camX = clampX(ax - ((ax - s.camX) / prevZ) * s.camZ);
          s.camY = clampY(ay - ((ay - s.camY) / prevZ) * s.camZ);
          if (Math.abs(z - s.camZ) < 0.001) s.anchor = null;
        }
        worldRef.current.style.transform = `translate3d(${s.camX}px, ${s.camY}px, 0) scale(${s.camZ})`;
      }

      if (paused.current) return;
      let dx = 0;
      let dy = 0;
      if (s.keys.size > 0) {
        if (s.keys.has('arrowleft') || s.keys.has('a')) dx -= 1;
        if (s.keys.has('arrowright') || s.keys.has('d')) dx += 1;
        if (s.keys.has('arrowup') || s.keys.has('w')) dy -= 1;
        if (s.keys.has('arrowdown') || s.keys.has('s')) dy += 1;
      } else {
        const gx = s.tx - s.x;
        const gy = s.ty - s.y;
        const dist = Math.hypot(gx, gy);
        if (dist > SPEED) {
          dx = gx / dist;
          dy = gy / dist;
        } else if (s.pending) {
          const id = s.pending;
          s.pending = null;
          setFocusId(id);
        }
      }
      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy) || 1;
        s.x = Math.max(24, Math.min(WORLD_W - 24, s.x + (dx / len) * SPEED));
        s.y = Math.max(24, Math.min(WORLD_H - 24, s.y + (dy / len) * SPEED));
        if (s.keys.size > 0) {
          s.tx = s.x;
          s.ty = s.y;
        }
        if (dx !== 0) s.dir = dx > 0 ? 1 : -1;
        inner.current?.classList.add('sprite-bob');
      } else {
        inner.current?.classList.remove('sprite-bob');
      }
      if (ref.current) ref.current.style.transform = `translate(${s.x - 16}px, ${s.y - 34}px)`;
      if (inner.current) inner.current.style.transform = `scaleX(${s.dir})`;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('gv:travel', onTravel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      stage?.removeEventListener('wheel', onWheel);
    };
  }, [setFocusId, setZoom, worldRef]);

  return (
    <div
      ref={ref}
      className="absolute z-20"
      style={{ transform: `translate(${WORLD_W / 2 - 16}px, ${WORLD_H / 2 + 136}px)` }}
    >
      <div className="flex flex-col items-center">
        <div ref={inner} className="pixel">
          <PlayerSprite />
        </div>
        <span aria-hidden className="mt-0.5 h-1.5 w-6 rounded-full bg-black/50 blur-[2px]" />
        <span className="font-pixel mt-0.5 rounded-sm bg-[#3b6bff] px-1 text-[11px] leading-4 font-bold text-white">
          you
        </span>
      </div>
    </div>
  );
}

export function PlayerSprite() {
  return (
    <svg width="26" height="34" viewBox="0 0 13 17" shapeRendering="crispEdges" aria-label="Your villager">
      <rect x="3" y="0" width="7" height="2" fill="#6b4223" />
      <rect x="2" y="1" width="9" height="2" fill="#6b4223" />
      <rect x="3" y="3" width="7" height="4" fill="#e8b98a" />
      <rect x="4" y="4" width="1" height="1" fill="#1c1c1c" />
      <rect x="8" y="4" width="1" height="1" fill="#1c1c1c" />
      <rect x="3" y="7" width="7" height="5" fill="#3b6bff" />
      <rect x="2" y="8" width="1" height="3" fill="#3b6bff" />
      <rect x="10" y="8" width="1" height="3" fill="#3b6bff" />
      <rect x="4" y="12" width="2" height="4" fill="#2a2d36" />
      <rect x="7" y="12" width="2" height="4" fill="#2a2d36" />
      <rect x="4" y="16" width="2" height="1" fill="#0f1115" />
      <rect x="7" y="16" width="2" height="1" fill="#0f1115" />
    </svg>
  );
}
