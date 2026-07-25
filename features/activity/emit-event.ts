import 'server-only';

import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import type { EventType } from '@/types/event';

export type EmitInput = {
  type: EventType;
  actorName: string;
  message: string;
  projectId?: string | null;
  issueId?: string | null;
  issueKey?: string | null;
};

// Internal server-only write shared by issue/comment actions and the simulated teammates.
export async function emitEvent(input: EmitInput): Promise<void> {
  await prisma.event.create({
    data: {
      type: input.type,
      actorName: input.actorName,
      message: input.message,
      projectId: input.projectId ?? null,
      issueId: input.issueId ?? null,
      issueKey: input.issueKey ?? null,
    },
  });
  revalidateTag('activity', 'max');
}
