import 'server-only';

import { prisma } from '@/lib/db';
import { toComment, type Comment } from '@/types/comment';

// Uncached live read — comments sync via SWR polling.
export async function getComments(issueId: string): Promise<Comment[]> {
  const rows = await prisma.comment.findMany({
    where: { issueId },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { avatarColor: true } } },
  });
  return rows.map(toComment);
}
