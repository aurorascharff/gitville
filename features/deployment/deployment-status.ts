import 'server-only';

import { prisma } from '@/lib/db';
import { toLogLine, type DeployEngineKind, type DeploymentStatus, type DeploymentStatusPayload } from '@/types/deployment';

// Uncached live read: the current status + full log tail for a deployment. Seeds the SWR
// cache on the server (via preload) and backs the client polling route while a build streams.
export async function getDeploymentStatus(deployId: string): Promise<DeploymentStatusPayload> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deployId },
    include: { logs: { orderBy: { seq: 'asc' } } },
  });

  if (!deployment) {
    return { status: 'failed', url: null, engine: 'simulated', durationMs: null, logs: [] };
  }

  return {
    status: deployment.status as DeploymentStatus,
    url: deployment.url,
    engine: deployment.engine as DeployEngineKind,
    durationMs: deployment.durationMs,
    logs: deployment.logs.map(log => toLogLine(log, deployment.createdAt)),
  };
}
