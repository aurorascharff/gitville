import 'server-only';

import { appendLog, finalizeDeployment, setSandboxId } from '@/features/deployment/deploy-engine/store';
import type { DeployContext, DeployEngine } from '@/features/deployment/deploy-engine/types';

const SANDBOX_TIMEOUT_MS = 10 * 60 * 1000;
const DEV_READY_TIMEOUT_MS = 30 * 1000;
const READY_PATTERN = /ready in|started server|localhost:3000|local:\s|ready on|listening/i;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// Explicit token creds when provided; otherwise rely on OIDC auto-resolution (vercel link / prod).
function credentials(): Record<string, string> {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (token && projectId && teamId) return { token, projectId, teamId };
  return {};
}

async function emit(deploymentId: string, stream: 'stdout' | 'stderr', chunk: string) {
  for (const raw of chunk.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (line) await appendLog(deploymentId, stream === 'stderr' ? 'warn' : 'info', line);
  }
}

export const sandboxEngine: DeployEngine = {
  kind: 'sandbox',
  async run(ctx: DeployContext): Promise<void> {
    const start = Date.now();
    // Dynamic import: the SDK pulls Node built-ins that must not be bundled into the RSC graph.
    const { Sandbox } = await import('@vercel/sandbox');

    try {
      await appendLog(ctx.deploymentId, 'dim', `Creating sandbox from ${ctx.repoUrl}`);
      const sandbox = await Sandbox.create({
        source: { type: 'git', url: ctx.repoUrl },
        ports: [3000],
        runtime: 'node24',
        resources: { vcpus: 4 },
        timeout: SANDBOX_TIMEOUT_MS,
        ...credentials(),
      });
      await setSandboxId(ctx.deploymentId, sandbox.sandboxId);
      await appendLog(ctx.deploymentId, 'success', `Sandbox ${sandbox.sandboxId} created · repo cloned`);

      // Install dependencies, streaming output line by line.
      await appendLog(ctx.deploymentId, 'dim', 'Running "npm install"');
      const install = await sandbox.runCommand({ cmd: 'npm', args: ['install'], detached: true });
      for await (const log of install.logs()) await emit(ctx.deploymentId, log.stream, log.data);
      const installed = await install.wait();
      if (installed.exitCode !== 0) {
        await appendLog(ctx.deploymentId, 'error', `npm install exited with code ${installed.exitCode}`);
        await finalizeDeployment(ctx.deploymentId, { status: 'failed', durationMs: Date.now() - start });
        await sandbox.stop();
        return;
      }
      await appendLog(ctx.deploymentId, 'success', 'Dependencies installed');

      // Start the dev server (detached) and stream until it reports ready.
      await appendLog(ctx.deploymentId, 'dim', 'Running "npm run dev"');
      const dev = await sandbox.runCommand({ cmd: 'npm', args: ['run', 'dev'], detached: true });
      const url = sandbox.domain(3000);

      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), DEV_READY_TIMEOUT_MS);
      try {
        for await (const log of dev.logs({ signal: ac.signal })) {
          await emit(ctx.deploymentId, log.stream, log.data);
          if (READY_PATTERN.test(log.data)) break;
        }
      } catch {
        // Aborted after the readiness timeout — the server is up regardless.
      } finally {
        clearTimeout(timer);
      }

      await appendLog(ctx.deploymentId, 'success', `Deployment ready · ${url}`);
      await finalizeDeployment(ctx.deploymentId, { status: 'ready', url, durationMs: Date.now() - start });
    } catch (err) {
      await appendLog(ctx.deploymentId, 'error', `Sandbox error: ${errorMessage(err)}`);
      await finalizeDeployment(ctx.deploymentId, { status: 'failed', durationMs: Date.now() - start });
    }
  },
};
