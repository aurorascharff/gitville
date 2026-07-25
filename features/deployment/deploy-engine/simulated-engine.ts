import 'server-only';

import { appendLog, finalizeDeployment } from '@/features/deployment/deploy-engine/store';
import type { DeployContext, DeployEngine, LogInput } from '@/features/deployment/deploy-engine/types';

const FAILURE_PROBABILITY = 0.2;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Canned build script; each line streams ~1.8s apart so the SWR poll paints it live.
function script(ctx: DeployContext): (LogInput & { delayMs: number })[] {
  const short = ctx.repoUrl.replace(/^https?:\/\//, '');
  return [
    { level: 'dim', message: `Cloning ${short} (Branch: main)`, delayMs: 400 },
    { level: 'success', message: 'Cloning completed', delayMs: 1600 },
    { level: 'dim', message: 'Detected Node.js project', delayMs: 1200 },
    { level: 'dim', message: 'Running "npm install"', delayMs: 900 },
    { level: 'info', message: 'added 142 packages in 5.8s', delayMs: 2400 },
    { level: 'success', message: 'Dependencies installed', delayMs: 900 },
    { level: 'dim', message: 'Running "next build"', delayMs: 1200 },
    { level: 'info', message: '   ▲ Next.js 16.3.0 (Turbopack)', delayMs: 1400 },
    { level: 'success', message: '   ✓ Compiled successfully', delayMs: 2200 },
    { level: 'dim', message: '   ✓ Collecting page data', delayMs: 1600 },
    { level: 'dim', message: '   ✓ Generating static pages (12/12)', delayMs: 1800 },
    { level: 'success', message: 'Build completed', delayMs: 1200 },
    { level: 'dim', message: 'Uploading build outputs (24.1 MB)', delayMs: 1400 },
  ];
}

export const simulatedEngine: DeployEngine = {
  kind: 'simulated',
  async run(ctx: DeployContext): Promise<void> {
    const start = Date.now();
    const lines = script(ctx);
    // Decide up front whether this build fails, and where.
    const willFail = Math.random() < FAILURE_PROBABILITY;
    const failAt = willFail ? 8 + Math.floor(Math.random() * 3) : lines.length;

    for (let i = 0; i < Math.min(failAt, lines.length); i++) {
      await sleep(lines[i].delayMs);
      await appendLog(ctx.deploymentId, lines[i].level, lines[i].message);
    }

    if (willFail) {
      await sleep(800);
      await appendLog(ctx.deploymentId, 'error', '   ✗ Failed to compile.');
      await appendLog(ctx.deploymentId, 'error', '   Type error: Cannot find name "deplyo".');
      await appendLog(ctx.deploymentId, 'error', 'Build failed');
      await finalizeDeployment(ctx.deploymentId, { status: 'failed', durationMs: Date.now() - start });
      return;
    }

    const url = `https://${ctx.projectName}-${ctx.deploymentId.slice(-6)}.vercel.app`;
    await sleep(900);
    await appendLog(ctx.deploymentId, 'success', `Deployment ready · ${url}`);
    await finalizeDeployment(ctx.deploymentId, { status: 'ready', url, durationMs: Date.now() - start });
  },
};
