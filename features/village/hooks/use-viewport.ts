'use client';

import { useLayoutEffect, useState } from 'react';

export type Viewport = { w: number; h: number };
export type MeasuredViewport = Viewport & { ready: boolean };

export function useViewport(fallback: Viewport = { w: 1400, h: 900 }): MeasuredViewport {
  const [viewport, setViewport] = useState<MeasuredViewport>(() => ({ ...fallback, ready: false }));

  useLayoutEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight, ready: true });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return viewport;
}
