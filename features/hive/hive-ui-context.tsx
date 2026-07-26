'use client';

import { createContext, useContext, useState } from 'react';
import type { RepoData } from '@/types/github';

export type Tooltip = { x: number; y: number; title: string; body: string | null; when: string | null };

// UI-only state. Data lives in the SWR cache — see use-hive-data.ts.
type HiveUi = {
  slug: string;
  repo: RepoData;
  pinned: string[];
  scrub: number;
  setScrub: (v: number) => void;
  zoom: number;
  setZoom: (fn: (z: number) => number) => void;
  buzzOpen: boolean;
  setBuzzOpen: (fn: (o: boolean) => boolean) => void;
  focusId: string | null;
  setFocusId: (id: string | null) => void;
  tip: Tooltip | null;
  setTip: (t: Tooltip | null) => void;
};

const HiveUiContext = createContext<HiveUi | null>(null);

export function useHiveUi(): HiveUi {
  const ctx = useContext(HiveUiContext);
  if (!ctx) throw new Error('useHiveUi must be used inside <HiveUiProvider>');
  return ctx;
}

export function HiveUiProvider({
  repo,
  pinned,
  children,
}: {
  repo: RepoData;
  pinned: string[];
  children: React.ReactNode;
}) {
  const [scrub, setScrub] = useState(1000);
  const [zoom, setZoomState] = useState(1);
  const [buzzOpen, setBuzzOpenState] = useState(true);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [tip, setTip] = useState<Tooltip | null>(null);

  return (
    <HiveUiContext.Provider
      value={{
        slug: repo.slug,
        repo,
        pinned,
        scrub,
        setScrub,
        zoom,
        setZoom: fn => setZoomState(z => fn(z)),
        buzzOpen,
        setBuzzOpen: fn => setBuzzOpenState(o => fn(o)),
        focusId,
        setFocusId,
        tip,
        setTip,
      }}
    >
      {children}
    </HiveUiContext.Provider>
  );
}
