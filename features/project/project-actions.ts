'use server';

import { updateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/features/user/user-queries';

export async function addPin(projectId: string) {
  const userId = await verifyAuth();
  await prisma.pin.upsert({
    where: { userId_projectId: { userId, projectId } },
    create: { userId, projectId },
    update: {},
  });
  updateTag(`pins-${userId}`);
  return { ok: true as const };
}

export async function removePin(projectId: string) {
  const userId = await verifyAuth();
  await prisma.pin.deleteMany({ where: { userId, projectId } });
  updateTag(`pins-${userId}`);
  return { ok: true as const };
}
