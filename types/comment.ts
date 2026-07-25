import type { Comment as CommentRow } from '@/generated/prisma/client';

export type Comment = {
  id: string;
  issueId: string;
  userId: string;
  authorName: string;
  authorColor: string;
  body: string;
  createdAt: string;
};

export const commentsKey = (issueId: string) => `/api/issues/${issueId}/comments`;

export function toComment(row: CommentRow & { user?: { avatarColor: string } | null }): Comment {
  return {
    id: row.id,
    issueId: row.issueId,
    userId: row.userId,
    authorName: row.authorName,
    authorColor: row.user?.avatarColor ?? 'violet',
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}
