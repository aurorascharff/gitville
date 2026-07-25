import 'server-only';

import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { toProject, type Project } from '@/types/project';

export const getProjects = cache(async (): Promise<Project[]> => {
  'use cache';
  cacheLife('hours');
  cacheTag('projects');
  const rows = await prisma.project.findMany({ orderBy: { name: 'asc' } });
  return rows.map(toProject);
});
