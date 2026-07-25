import type { DeployEngineKind, LogLevel } from '@/types/deployment';

export type DeployContext = {
  deploymentId: string;
  projectId: string;
  projectName: string;
  repoUrl: string;
};

export type LogInput = { level: LogLevel; message: string };

export interface DeployEngine {
  readonly kind: DeployEngineKind;
  // Drives a build to completion: appends log lines and sets the final status/url.
  run(ctx: DeployContext): Promise<void>;
}
