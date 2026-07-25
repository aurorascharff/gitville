import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { SESSION_COOKIE } from '@/features/user/user-constants';
import { toUser, type User } from '@/types/user';

// Cookie read stays outside `'use cache'`; the id is then passed to the cached lookup.
export const getCurrentUserId = cache(async (): Promise<string> => {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) return '';
  return (await userExists(userId)) ? userId : '';
});

async function userExists(userId: string): Promise<boolean> {
  'use cache';
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  return Boolean(row);
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const row = await prisma.user.findUnique({ where: { id: userId } });
  return row ? toUser(row) : null;
});

export async function verifyAuth(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
    redirect('/login');
  }
  return userId;
}
