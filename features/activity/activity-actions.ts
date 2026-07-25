'use server';

import { prisma } from '@/lib/db';
import { verifyAuth } from '@/features/user/user-queries';

export async function markNotificationsRead() {
  const userId = await verifyAuth();
  await prisma.notificationRead.upsert({
    where: { userId },
    create: { userId, lastSeenAt: new Date() },
    update: { lastSeenAt: new Date() },
  });
  return { ok: true as const };
}
