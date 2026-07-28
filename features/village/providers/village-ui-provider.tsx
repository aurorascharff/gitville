'use client';

import { useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

type Tooltip = { x: number; y: number; title: string; body: string | null; when: string | null };

type VillageUi = {
  slug: string;
  scrub: number;
  setScrub: (v: number) => void;
  zoom: number;
  setZoom: (fn: (z: number) => number) => void;
  buzzOpen: boolean;
  setBuzzOpen: (fn: (o: boolean) => boolean) => void;
  peopleOpen: boolean;
  setPeopleOpen: (fn: (o: boolean) => boolean) => void;
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
  const [buzzOpen, setBuzzOpenState] = useState(false);
  const [peopleOpen, setPeopleOpenState] = useState(false);
  const [tip, setTip] = useState<Tooltip | null>(null);
  const searchParams = useSearchParams();
  const [focusId, setFocusIdState] = useState(() => searchParams.get('house'));
  const [aiCellId, setAiCellId] = useState<string | null>(() =>
    searchParams.get('ai') === '1' ? searchParams.get('house') : null,
  );
  const aiOn = Boolean(focusId && aiCellId === focusId);

  useEffect(() => {
    const syncUrlState = () => {
      const url = new URL(window.location.href);
      const nextFocusId = url.searchParams.get('house');
      setFocusIdState(nextFocusId);
      setAiCellId(url.searchParams.get('ai') === '1' ? nextFocusId : null);
    };
    window.addEventListener('popstate', syncUrlState);
    return () => window.removeEventListener('popstate', syncUrlState);
  }, []);

  const writeUrlState = (nextFocusId: string | null, nextAiOn: boolean) => {
    const url = new URL(window.location.href);
    if (nextFocusId) url.searchParams.set('house', nextFocusId);
    else url.searchParams.delete('house');
    if (nextAiOn && nextFocusId) url.searchParams.set('ai', '1');
    else url.searchParams.delete('ai');
    window.history.pushState(null, '', url);
  };

  const setFocusId = (id: string | null) => {
    setFocusIdState(id);
    setAiCellId(null);
    writeUrlState(id, false);
  };

  const setAiOn = (on: boolean) => {
    if (!focusId) return;
    setAiCellId(on ? focusId : null);
    writeUrlState(focusId, on);
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
        peopleOpen,
        setPeopleOpen: fn => setPeopleOpenState(o => fn(o)),
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
