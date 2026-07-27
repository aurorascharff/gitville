'use client';

import { createContext, useContext, useState } from 'react';
import type { RepoData } from '@/types/github';

export type Tooltip = { x: number; y: number; title: string; body: string | null; when: string | null };

// UI-only state. Data lives in the SWR cache — see use-village-data.ts.
type VillageUi = {
  slug: string;
  repo: RepoData;
  pinned: string[];
  scrub: number;
  setScrub: (v: number) => void;
  buzzOpen: boolean;
  setBuzzOpen: (fn: (o: boolean) => boolean) => void;
  focusId: string | null;
  setFocusId: (id: string | null) => void;
  tip: Tooltip | null;
  setTip: (t: Tooltip | null) => void;
};

const VillageUiContext = createContext<VillageUi | null>(null);

export function useVillageUi(): VillageUi {
  const ctx = useContext(VillageUiContext);
  if (!ctx) throw new Error('useVillageUi must be used inside <VillageUiProvider>');
  return ctx;
}

export function VillageUiProvider({
  repo,
  pinned,
  children,
}: {
  repo: RepoData;
  pinned: string[];
  children: React.ReactNode;
}) {
  const [scrub, setScrub] = useState(1000);
  const [buzzOpen, setBuzzOpenState] = useState(true);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [tip, setTip] = useState<Tooltip | null>(null);

  return (
    <VillageUiContext.Provider
      value={{
        slug: repo.slug,
        repo,
        pinned,
        scrub,
        setScrub,
        buzzOpen,
        setBuzzOpen: fn => setBuzzOpenState(o => fn(o)),
        focusId,
        setFocusId,
        tip,
        setTip,
      }}
    >
      {children}
    </VillageUiContext.Provider>
  );
}
