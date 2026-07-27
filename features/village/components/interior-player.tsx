'use client';

import { useEffect, useRef } from 'react';
import { PlayerSprite } from '@/features/village/components/player';
import { WALL_H } from '@/features/village/room-geometry';

export function InteriorPlayer({
  width,
  height,
  walkTargetRef,
  roomRef,
  onExit,
}: {
  width: number;
  height: number;
  walkTargetRef: React.RefObject<{ x: number; y: number } | null>;
  roomRef: React.RefObject<HTMLDivElement | null>;
  onExit: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const exitRef = useRef(onExit);

  useEffect(() => {
    exitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    const s = {
      x: width / 2,
      y: height - 78,
      keys: new Set<string>(),
      dir: 1,
      left: false,
      camX: Number.NaN,
      camY: Number.NaN,
    };
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

      if (roomRef.current) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const targetX = width <= vw ? (vw - width) / 2 : Math.min(0, Math.max(vw - width, vw / 2 - s.x));
        const targetY = height <= vh ? (vh - height) / 2 : Math.min(0, Math.max(vh - height, vh / 2 - s.y));
        if (Number.isNaN(s.camX)) {
          s.camX = targetX;
          s.camY = targetY;
        } else {
          s.camX += (targetX - s.camX) * 0.12;
          s.camY += (targetY - s.camY) * 0.12;
        }
        roomRef.current.style.transform = `translate3d(${s.camX}px, ${s.camY}px, 0)`;
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
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [width, height, walkTargetRef, roomRef]);

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
