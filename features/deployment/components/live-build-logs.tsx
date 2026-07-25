'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useSWR from 'swr';
import { BuildLogsShell, CursorRow, LogRow, LogStreamFrame } from '@/features/deployment/components/log-view';
import { isTerminal, type DeploymentStatusPayload } from '@/types/deployment';

const fetcher = (url: string): Promise<DeploymentStatusPayload> => fetch(url).then(res => res.json());

// Reads the server-seeded SWR cache (via preload + cacheData) and keeps polling the status
// route every 2s while the build is in progress, stopping the moment it reaches a terminal state.
export function LiveBuildLogs({ swrKey }: { swrKey: string }) {
  const router = useRouter();
  const { data } = useSWR<DeploymentStatusPayload>(swrKey, fetcher, {
    suspense: true,
    refreshInterval: latest => (latest && isTerminal(latest.status) ? 0 : 2000),
    revalidateOnFocus: false,
  });

  const building = data ? !isTerminal(data.status) : true;

  // Once the build finishes, refresh so the cached header + lists pick up the final state/url.
  useEffect(() => {
    if (data && isTerminal(data.status)) router.refresh();
  }, [data?.status, router]);

  return (
    <BuildLogsShell>
      <LogStreamFrame>
        {data?.logs.map(line => <LogRow key={line.seq} line={line} />)}
        {building ? <CursorRow /> : null}
      </LogStreamFrame>
    </BuildLogsShell>
  );
}
