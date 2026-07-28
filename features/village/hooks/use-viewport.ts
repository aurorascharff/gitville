'use client';

import { useEffect, useState } from 'react';

export type Viewport = { w: number; h: number };

export function useViewport(fallback: Viewport = { w: 1400, h: 900 }): Viewport {
  const [viewport, setViewport] = useState(fallback);

  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return viewport;
}
