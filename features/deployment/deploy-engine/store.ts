import 'server-only';

import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import type { DeploymentStatus, LogLevel } from '@/types/deployment';

// Append a single log line, assigning the next sequence number for this deployment.
export async function appendLog(deploymentId: string, level: LogLevel, message: string): Promise<void> {
  const last = await prisma.deploymentLog.findFirst({
    where: { deploymentId },
    orderBy: { seq: 'desc' },
    select: { seq: true },
  });
  await prisma.deploymentLog.create({
    data: { deploymentId, seq: (last?.seq ?? -1) + 1, level, message },
  });
}

export async function finalizeDeployment(
  deploymentId: string,
  result: { status: Extract<DeploymentStatus, 'ready' | 'failed' | 'cancelled'>; url?: string | null; durationMs: number },
): Promise<void> {
  const row = await prisma.deployment.update({
    where: { id: deploymentId },
    data: {
      status: result.status,
      url: result.url ?? null,
      durationMs: result.durationMs,
      finishedAt: new Date(),
    },
    select: { projectId: true },
  });
  invalidateDeployment(deploymentId, row.projectId);
}

export async function setSandboxId(deploymentId: string, sandboxId: string): Promise<void> {
  await prisma.deployment.update({ where: { id: deploymentId }, data: { sandboxId } });
}

// Clear cached reads so a finished build shows fresh data on navigation. `after()` runs
// outside the action's render, so we use revalidateTag (with a profile) rather than updateTag.
export function invalidateDeployment(deploymentId: string, projectId: string): void {
  revalidateTag(`deployment-${deploymentId}`, 'max');
  revalidateTag(`build-log-${deploymentId}`, 'max');
  revalidateTag(`deployments-${projectId}`, 'max');
  revalidateTag('recent-deployments', 'max');
}
