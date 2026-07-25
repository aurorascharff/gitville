'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { emitEvent } from '@/features/activity/emit-event';
import { getCurrentUser } from '@/features/user/user-queries';

const bodySchema = z.string().trim().min(1, 'Say something').max(1000, 'Keep it under 1000 characters');

export async function addComment(issueId: string, body: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Not signed in' };
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { number: true, projectId: true, project: { select: { key: true } } },
  });
  if (!issue) return { ok: false as const, error: 'Issue not found' };

  await prisma.comment.create({ data: { issueId, userId: user.id, authorName: user.name, body: parsed.data } });

  const key = `${issue.project.key}-${issue.number}`;
  await emitEvent({
    type: 'issue.commented',
    actorName: user.name,
    message: `commented on ${key}`,
    projectId: issue.projectId,
    issueId,
    issueKey: key,
  });
  return { ok: true as const };
}

export async function deleteComment(commentId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Not signed in' };
  await prisma.comment.deleteMany({ where: { id: commentId, userId: user.id } });
  return { ok: true as const };
}
