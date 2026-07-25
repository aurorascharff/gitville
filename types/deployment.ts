import type { Deployment as DeploymentRow, DeploymentLog as DeploymentLogRow } from '@/generated/prisma/client';

export type DeploymentStatus = 'queued' | 'building' | 'ready' | 'failed' | 'cancelled';

export type DeploymentSource = 'git' | 'manual';

export type DeployEngineKind = 'simulated' | 'sandbox';

export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'dim';

export type Commit = { sha: string; message: string; author: string; branch: string };

export type Deployment = {
  id: string;
  projectId: string;
  version: string;
  status: DeploymentStatus;
  region: string;
  commit: Commit;
  durationMs: number | null;
  source: DeploymentSource;
  engine: DeployEngineKind;
  url: string | null;
  sandboxId: string | null;
  createdAt: Date;
};

export type LogLine = {
  seq: number;
  level: LogLevel;
  message: string;
  timestamp: string;
};

export const TERMINAL_STATUSES: DeploymentStatus[] = ['ready', 'failed', 'cancelled'];

export function isTerminal(status: DeploymentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function toDeployment(row: DeploymentRow): Deployment {
  return {
    id: row.id,
    projectId: row.projectId,
    version: row.version,
    status: row.status as DeploymentStatus,
    region: row.region,
    commit: parseCommit(row.commit),
    durationMs: row.durationMs,
    source: row.source as DeploymentSource,
    engine: row.engine as DeployEngineKind,
    url: row.url,
    sandboxId: row.sandboxId,
    createdAt: row.createdAt,
  };
}

// Elapsed wall-clock time rendered as a build clock, e.g. "00:01:42".
export function toLogLine(row: DeploymentLogRow, startedAt: Date): LogLine {
  const elapsed = Math.max(0, Math.floor((row.createdAt.getTime() - startedAt.getTime()) / 1000));
  const hh = Math.floor(elapsed / 3600);
  const mm = Math.floor((elapsed % 3600) / 60);
  const ss = elapsed % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return {
    seq: row.seq,
    level: row.level as LogLevel,
    message: row.message,
    timestamp: `${pad(hh)}:${pad(mm)}:${pad(ss)}`,
  };
}

function parseCommit(value: string): Commit {
  try {
    return JSON.parse(value) as Commit;
  } catch {
    return { sha: '0000000', message: '', author: 'unknown', branch: 'main' };
  }
}
