import type { Event as EventRow } from '@/generated/prisma/client';

export type EventType =
  | 'issue.created'
  | 'issue.status'
  | 'issue.assigned'
  | 'issue.priority'
  | 'issue.commented'
  | 'issue.labeled';

export type ActivityEvent = {
  id: string;
  type: EventType;
  actorName: string;
  message: string;
  projectId: string | null;
  issueId: string | null;
  issueKey: string | null;
  createdAt: string;
};

export type NotificationsPayload = { count: number };
export const NOTIFICATIONS_KEY = '/api/notifications';

export function toActivityEvent(row: EventRow): ActivityEvent {
  return {
    id: row.id,
    type: row.type as EventType,
    actorName: row.actorName,
    message: row.message,
    projectId: row.projectId,
    issueId: row.issueId,
    issueKey: row.issueKey,
    createdAt: row.createdAt.toISOString(),
  };
}
