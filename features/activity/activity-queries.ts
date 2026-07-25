import 'server-only';

import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/features/user/user-queries';
import { toActivityEvent, type ActivityEvent } from '@/types/event';

export const getRecentEvents = cache(async (limit = 40): Promise<ActivityEvent[]> => {
  'use cache';
  cacheLife('minutes');
  cacheTag('activity');
  const rows = await prisma.event.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  return rows.map(toActivityEvent);
});

// Per-issue history (the issue's own events) — live via polling in the detail tabs.
export async function getIssueEvents(issueId: string): Promise<ActivityEvent[]> {
  const rows = await prisma.event.findMany({ where: { issueId }, orderBy: { createdAt: 'desc' }, take: 40 });
  return rows.map(toActivityEvent);
}

// Unseen since the viewer's last-seen marker; drives the live badge (polled, uncached).
export async function getUnseenCount(): Promise<number> {
  const userId = await getCurrentUserId();
  if (!userId) return 0;
  const read = await prisma.notificationRead.findUnique({ where: { userId } });
  const since = read?.lastSeenAt ?? new Date(0);
  return prisma.event.count({ where: { createdAt: { gt: since } } });
}
