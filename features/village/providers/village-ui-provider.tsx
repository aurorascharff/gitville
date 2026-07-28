'use client';

import { useSearchParams } from 'next/navigation';
import { createContext, useContext, useState } from 'react';

type Tooltip = { x: number; y: number; title: string; body: string | null; when: string | null };

type VillageUi = {
  slug: string;
  scrub: number;
  setScrub: (v: number) => void;
  zoom: number;
  setZoom: (fn: (z: number) => number) => void;
  buzzOpen: boolean;
  setBuzzOpen: (fn: (o: boolean) => boolean) => void;
  focusId: string | null;
  setFocusId: (id: string | null) => void;
  aiOn: boolean;
  setAiOn: (on: boolean) => void;
  tip: Tooltip | null;
  setTip: (t: Tooltip | null) => void;
};

const VillageUiContext = createContext<VillageUi | null>(null);

export function useVillageUi(): VillageUi {
  const ctx = useContext(VillageUiContext);
  if (!ctx) throw new Error('useVillageUi must be used inside <VillageUiProvider>');
  return ctx;
}

export function VillageUiProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const [scrub, setScrub] = useState(1000);
  const [zoom, setZoomState] = useState(1);
  const [buzzOpen, setBuzzOpenState] = useState(true);
  const [tip, setTip] = useState<Tooltip | null>(null);

  const searchParams = useSearchParams();
  const focusId = searchParams.get('house');
  const aiOn = searchParams.get('ai') === '1';
  const setFocusId = (id: string | null) => {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('house', id);
    else url.searchParams.delete('house');
    url.searchParams.delete('ai');
    window.history.pushState(null, '', url);
  };
  const setAiOn = (on: boolean) => {
    const url = new URL(window.location.href);
    if (on) url.searchParams.set('ai', '1');
    else url.searchParams.delete('ai');
    window.history.pushState(null, '', url);
  };

  return (
    <VillageUiContext.Provider
      value={{
        slug,
        scrub,
        setScrub,
        zoom,
        setZoom: fn => setZoomState(z => fn(z)),
        buzzOpen,
        setBuzzOpen: fn => setBuzzOpenState(o => fn(o)),
        focusId,
        setFocusId,
        aiOn,
        setAiOn,
        tip,
        setTip,
      }}
    >
      {children}
    </VillageUiContext.Provider>
  );
}
