import 'server-only';

import { simulatedEngine } from '@/features/deployment/deploy-engine/simulated-engine';
import { sandboxEngine } from '@/features/deployment/deploy-engine/sandbox-engine';
import type { DeployEngine } from '@/features/deployment/deploy-engine/types';
import type { DeployEngineKind } from '@/types/deployment';

export function realSandboxEnabled(): boolean {
  // Hard safety gate: real deploys are LOCAL/DEV ONLY. The public production deployment
  // always runs the simulated engine, so untrusted visitors can never spend your Vercel
  // sandbox compute — no env var can turn real deploys on in production.
  if (process.env.NODE_ENV === 'production') return false;
  if (process.env.ENABLE_REAL_SANDBOX !== 'true') return false;
  // Real deploys need resolvable Vercel credentials (explicit token or OIDC).
  return Boolean(process.env.VERCEL_TOKEN || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL_AUTOMATION_BYPASS_SECRET);
}

export function getDeployEngine(): DeployEngine {
  return realSandboxEnabled() ? sandboxEngine : simulatedEngine;
}

export function activeEngineKind(): DeployEngineKind {
  return realSandboxEnabled() ? 'sandbox' : 'simulated';
}

export type { DeployContext, DeployEngine } from '@/features/deployment/deploy-engine/types';
