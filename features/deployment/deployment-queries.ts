import 'server-only';

import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { delay } from '@/lib/utils';
import { toDeployment, toLogLine, type Deployment, type LogLine } from '@/types/deployment';

export const getDeployments = cache(async (projectId: string): Promise<Deployment[]> => {
  'use cache';
  cacheLife('minutes');
  cacheTag(`deployments-${projectId}`);
  await delay(700);
  const rows = await prisma.deployment.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toDeployment);
});

export const getDeployment = cache(async (deployId: string): Promise<Deployment> => {
  'use cache';
  cacheLife('minutes');
  cacheTag(`deployment-${deployId}`);
  await delay(300);
  const row = await prisma.deployment.findUnique({ where: { id: deployId } });
  if (!row) notFound();
  return toDeployment(row);
});

export const getRecentDeployments = cache(async (limit = 6): Promise<Deployment[]> => {
  'use cache';
  cacheLife('minutes');
  cacheTag('recent-deployments');
  await delay(900);
  const rows = await prisma.deployment.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  return rows.map(toDeployment);
});

// Completed-build log (cached). In-progress logs are read dynamically via the status route.
export const getBuildLog = cache(async (deployId: string): Promise<LogLine[]> => {
  'use cache';
  cacheLife('minutes');
  cacheTag(`build-log-${deployId}`);
  await delay(500);
  return readLog(deployId);
});

// Uncached read used by the live status route while a build streams.
export async function readLog(deployId: string): Promise<LogLine[]> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deployId },
    select: { createdAt: true, logs: { orderBy: { seq: 'asc' } } },
  });
  if (!deployment) return [];
  return deployment.logs.map(log => toLogLine(log, deployment.createdAt));
}
