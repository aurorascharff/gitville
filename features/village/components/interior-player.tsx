'use client';

import { useEffect, useRef } from 'react';
import { PlayerSprite } from '@/features/village/components/player';
import { MAX_ZOOM, SIDEBAR_W, WALL_H } from '@/features/village/room-geometry';

export type NearItem = { x: number; y: number; index: number };

export function InteriorPlayer({
  width,
  height,
  walkTargetRef,
  roomRef,
  onExit,
  playerPosRef,
  itemsRef,
  onNear,
  frozenRef,
}: {
  width: number;
  height: number;
  walkTargetRef: React.RefObject<{ x: number; y: number } | null>;
  roomRef: React.RefObject<HTMLDivElement | null>;
  onExit: () => void;
  // Live player position (room coords), shared so the scene can react to it.
  playerPosRef: React.RefObject<{ x: number; y: number }>;
  // Furniture positions (room coords) to detect standing next to; read live so a
  // regen/AI toggle that reshuffles the room takes effect without remounting.
  itemsRef: React.RefObject<NearItem[]>;
  // Fires (only on change) with the index of the nearest item in range, or null.
  onNear: (index: number | null) => void;
  // While true (a close-up is open) the player can't move, so it can't wander
  // onto the mat and leave the room from behind the overlay.
  frozenRef: React.RefObject<boolean>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const exitRef = useRef(onExit);
  const nearRef = useRef(onNear);

  useEffect(() => {
    exitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    nearRef.current = onNear;
  }, [onNear]);

  useEffect(() => {
    const s = {
      x: width / 2,
      y: height - 78,
      keys: new Set<string>(),
      dir: 1,
      left: false,
      camX: Number.NaN,
      camY: Number.NaN,
      near: -1,
    };
    const SPEED = 4;
    const NEAR_RANGE = 90;
    const matX = width / 2;
    const matY = height - 16;

    function onKeyDown(e: KeyboardEvent) {
      if (frozenRef.current) return;
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

      if (roomRef.current) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        // Fit the room into the space right of the reserved info sidebar (must
        // match InteriorScene so the click → room-coordinate mapping stays
        // calibrated), then follow the player within that region.
        const pad = 32;
        const mobile = vw < 640;
        // Mobile: the sidebar is a hidden drawer, so the room fills the whole
        // screen (cover) and you walk around it — the camera below pans the
        // overflow. Desktop: fit the entire room into the space beside the
        // sidebar (contain). Both must agree so the click → room-coord mapping
        // stays calibrated.
        const sidebar = mobile ? 0 : Math.min(SIDEBAR_W, vw * 0.4);
        const availW = vw - sidebar;
        const scale = mobile
          ? Math.min(2, Math.max(availW / width, vh / height))
          : Math.max(0.6, Math.min((availW - pad * 2) / width, (vh - pad * 2) / height, MAX_ZOOM));
        const sw = width * scale;
        const sh = height * scale;
        const targetX =
          sw <= availW
            ? sidebar + (availW - sw) / 2
            : Math.min(sidebar, Math.max(sidebar + availW - sw, sidebar + availW / 2 - s.x * scale));
        const targetY = sh <= vh ? (vh - sh) / 2 : Math.min(0, Math.max(vh - sh, vh / 2 - s.y * scale));
        if (Number.isNaN(s.camX)) {
          s.camX = targetX;
          s.camY = targetY;
        } else {
          s.camX += (targetX - s.camX) * 0.12;
          s.camY += (targetY - s.camY) * 0.12;
        }
        roomRef.current.style.transform = `translate3d(${s.camX}px, ${s.camY}px, 0) scale(${scale})`;
      }

      // Frozen (a close-up is open): drop any held keys / walk target so the
      // player stands still behind the overlay and can't drift onto the mat.
      if (frozenRef.current) {
        s.keys.clear();
        walkTargetRef.current = null;
      }

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

      // Publish the live position and the nearest in-range furniture (report only
      // on change, so the scene re-renders when you step up to / away from a piece
      // rather than every frame).
      playerPosRef.current.x = s.x;
      playerPosRef.current.y = s.y;
      let best = -1;
      let bestD = NEAR_RANGE;
      for (const it of itemsRef.current) {
        const d = Math.hypot(s.x - it.x, s.y - it.y);
        if (d < bestD) {
          bestD = d;
          best = it.index;
        }
      }
      if (best !== s.near) {
        s.near = best;
        nearRef.current(best < 0 ? null : best);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [width, height, walkTargetRef, roomRef, playerPosRef, itemsRef, frozenRef]);

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
