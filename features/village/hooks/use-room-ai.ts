'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { rememberRoomSpec, roomSpecKey } from '@/features/village/hooks/use-village-data';
import { useVillageUi } from '@/features/village/providers/village-ui-provider';
import type { Cell } from '@/features/village/utils/village-model';
import { generateRoomFurniture } from '@/features/village/village-actions';

export function useRoomAi(cell: Cell, ai: boolean, onToggle: (on: boolean) => void) {
  const { slug } = useVillageUi();
  const { mutate } = useSWRConfig();
  const [pending, startTransition] = useTransition();

  function generate() {
    if (ai || pending) return;
    startTransition(async () => {
      const res = await generateRoomFurniture({ slug, cellId: cell.id });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      rememberRoomSpec(slug, cell.id, res.spec);
      await mutate(roomSpecKey(slug, cell.id, true), res.spec, { revalidate: false });
      onToggle(true);
    });
  }

  return { pending, generate };
}
