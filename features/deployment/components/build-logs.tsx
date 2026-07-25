import { preload, SWRConfig } from 'swr';
import { getBuildLog, getDeployment } from '@/features/deployment/deployment-queries';
import { getDeploymentStatus } from '@/features/deployment/deployment-status';
import { BuildLogsShell, LogRow, LogSkeletonRows, LogStreamFrame } from '@/features/deployment/components/log-view';
import { LiveBuildLogs } from '@/features/deployment/components/live-build-logs';
import { isTerminal, statusKey } from '@/types/deployment';

export async function BuildLogs({ deployId }: { deployId: string }) {
  const deployment = await getDeployment(deployId);

  // Finished builds render straight from the cached log query — no client polling needed.
  if (isTerminal(deployment.status)) {
    const lines = await getBuildLog(deployId);
    return (
      <BuildLogsShell>
        <LogStreamFrame>
          {lines.map(line => (
            <LogRow key={line.seq} line={line} />
          ))}
        </LogStreamFrame>
      </BuildLogsShell>
    );
  }

  // In-progress: seed SWR on the server (preload → cacheData) so the client hydrates the
  // current logs with no refetch, then takes over polling. This dogfoods swr@2.5 beta.
  const key = statusKey(deployId);
  const cacheData = preload(key, () => getDeploymentStatus(deployId));

  return (
    <SWRConfig value={{ cacheData }}>
      <LiveBuildLogs swrKey={key} />
    </SWRConfig>
  );
}

export function BuildLogsSkeleton() {
  return (
    <BuildLogsShell>
      <LogStreamFrame>
        <LogSkeletonRows />
      </LogStreamFrame>
    </BuildLogsShell>
  );
}
