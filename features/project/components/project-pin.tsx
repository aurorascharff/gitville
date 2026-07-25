'use client';

import { Pin } from 'lucide-react';
import { use, useOptimistic, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { addPin, removePin } from '@/features/project/project-actions';

export function ProjectPin({ projectId, pinnedIdsPromise }: { projectId: string; pinnedIdsPromise: Promise<string[]> }) {
  const pinnedIds = use(pinnedIdsPromise);
  const [optimisticPinned, setOptimisticPinned] = useOptimistic(pinnedIds.includes(projectId));
  const [, startTransition] = useTransition();

  return (
    <form
      className="relative z-20"
      action={() =>
        startTransition(async () => {
          const wasPinned = optimisticPinned;
          setOptimisticPinned(!wasPinned);
          await (wasPinned ? removePin(projectId) : addPin(projectId));
        })
      }
    >
      <Button
        type="submit"
        variant={optimisticPinned ? 'secondary' : 'outline'}
        size="sm"
        aria-pressed={optimisticPinned}
        aria-label={optimisticPinned ? 'Unpin project' : 'Pin project'}
      >
        <Pin size={11} strokeWidth={1.8} fill={optimisticPinned ? 'currentColor' : 'none'} />
        <span>{optimisticPinned ? 'Pinned' : 'Pin'}</span>
      </Button>
    </form>
  );
}

export function ProjectPinSkeleton() {
  return <Skeleton className="h-7 w-14 rounded-md" />;
}
