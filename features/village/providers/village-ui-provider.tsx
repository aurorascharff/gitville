'use client';

import { useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

type Tooltip = { x: number; y: number; title: string; body: string | null; when: string | null };
type AiRoomDecor = { theme: string; title: string | null };

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
  nearCellId: string | null;
  setNearCellId: (id: string | null) => void;
  aiOn: boolean;
  setAiOn: (on: boolean) => void;
  aiCellIds: ReadonlySet<string>;
  aiRoomDecor: Record<string, AiRoomDecor>;
  setAiRoomDecor: (cellId: string, decor: AiRoomDecor) => void;
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
  const [nearCellId, setNearCellId] = useState<string | null>(null);
  const [aiRoomDecor, setAiRoomDecorState] = useState<Record<string, AiRoomDecor>>({});
  const searchParams = useSearchParams();
  const [focusId, setFocusIdState] = useState(() => searchParams.get('house'));
  const [aiCellIds, setAiCellIds] = useState<Set<string>>(() => {
    const house = searchParams.get('house');
    return searchParams.get('ai') === '1' && house ? new Set([house]) : new Set();
  });
  const aiOn = Boolean(focusId && aiCellIds.has(focusId));

  useEffect(() => {
    const syncUrlState = () => {
      const url = new URL(window.location.href);
      const nextFocusId = url.searchParams.get('house');
      setFocusIdState(nextFocusId);
      if (url.searchParams.get('ai') === '1' && nextFocusId) {
        setAiCellIds(ids => new Set(ids).add(nextFocusId));
      }
    };
    window.addEventListener('popstate', syncUrlState);
    return () => window.removeEventListener('popstate', syncUrlState);
  }, []);

  const writeUrlState = (nextFocusId: string | null) => {
    const url = new URL(window.location.href);
    if (nextFocusId) url.searchParams.set('house', nextFocusId);
    else url.searchParams.delete('house');
    url.searchParams.delete('ai');
    window.history.pushState(null, '', url);
  };

  const setFocusId = (id: string | null) => {
    setFocusIdState(id);
    writeUrlState(id);
  };

  const setAiOn = (on: boolean) => {
    if (!focusId || !on) return;
    setAiCellIds(ids => new Set(ids).add(focusId));
    writeUrlState(focusId);
  };

  const setAiRoomDecor = (cellId: string, decor: AiRoomDecor) => {
    setAiRoomDecorState(current => {
      const previous = current[cellId];
      if (previous?.theme === decor.theme && previous.title === decor.title) return current;
      return { ...current, [cellId]: decor };
    });
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
        nearCellId,
        setNearCellId,
        aiOn,
        setAiOn,
        aiCellIds,
        aiRoomDecor,
        setAiRoomDecor,
        tip,
        setTip,
      }}
    >
      {children}
    </VillageUiContext.Provider>
  );
}
