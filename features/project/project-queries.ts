import 'server-only';

import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/features/user/user-queries';
import { delay } from '@/lib/utils';
import { toProject, type Project } from '@/types/project';

export const getProjects = cache(async ({ query }: { query?: string } = {}): Promise<Project[]> => {
  const projects = await getAllProjects();
  const q = query?.toLowerCase().trim();
  if (!q) return projects;
  return projects.filter(p =>
    [p.name, p.description, p.framework, p.language, p.status].some(field => field.toLowerCase().includes(q)),
  );
});

async function getAllProjects(): Promise<Project[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('projects');
  await delay(800);
  const rows = await prisma.project.findMany({ orderBy: { name: 'asc' } });
  return rows.map(toProject);
}

export const getProject = cache(async (id: string): Promise<Project> => {
  'use cache';
  cacheLife('hours');
  cacheTag('projects', `project-${id}`);
  await delay(400);
  const row = await prisma.project.findUnique({ where: { id } });
  if (!row) notFound();
  return toProject(row);
});

export const getPinnedProjectIds = cache(async (): Promise<string[]> => {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  return getPinnedIdsForUser(userId);
});

async function getPinnedIdsForUser(userId: string): Promise<string[]> {
  'use cache';
  cacheTag(`pins-${userId}`);
  await delay(600);
  const rows = await prisma.pin.findMany({ where: { userId }, select: { projectId: true } });
  return rows.map(r => r.projectId);
}
