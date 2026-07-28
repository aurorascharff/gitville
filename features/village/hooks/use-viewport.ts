'use client';

import { useLayoutEffect, useState } from 'react';

export type Viewport = { w: number; h: number };

export function useViewport(fallback: Viewport = { w: 1400, h: 900 }): Viewport {
  const [viewport, setViewport] = useState<Viewport>(() =>
    typeof window === 'undefined' ? fallback : { w: window.innerWidth, h: window.innerHeight },
  );

  useLayoutEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return viewport;
}
