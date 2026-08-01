'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { rememberRoomSpec } from '@/features/village/hooks/use-village-data';
import { useVillageUi } from '@/features/village/providers/village-ui-provider';
import type { Cell } from '@/features/village/utils/village-model';
import { generateRoomFurniture } from '@/features/village/village-actions';
import { roomSpecKeys } from '@/features/village/village-cache';

export function useRoomAi(cell: Cell, generated: boolean, onToggle: (on: boolean) => void) {
  const { slug } = useVillageUi();
  const { mutate } = useSWRConfig();
  const [pending, startTransition] = useTransition();

  function generate() {
    if (generated || pending) return;
    startTransition(async () => {
      const res = await generateRoomFurniture({ slug, cellId: cell.id });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      rememberRoomSpec(slug, cell.id, res.spec);
      await mutate(roomSpecKeys.detail(slug, cell.id, true), res.spec, { revalidate: false });
      onToggle(true);
    });
  }

  return { pending, generate };
}
