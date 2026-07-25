import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';

const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

type Level = 'info' | 'warn' | 'error' | 'success' | 'dim';
type LogSeed = { level: Level; message: string };

const PROJECTS = [
  { name: 'compass', framework: 'Next.js', language: 'TypeScript', status: 'production', icon: 'compass' },
  { name: 'feather', framework: 'Astro', language: 'TypeScript', status: 'production', icon: 'feather' },
  { name: 'flame', framework: 'Next.js', language: 'TypeScript', status: 'production', icon: 'flame' },
  { name: 'orbit', framework: 'SvelteKit', language: 'TypeScript', status: 'production', icon: 'orbit' },
  { name: 'prism', framework: 'Remix', language: 'TypeScript', status: 'failed', icon: 'prism' },
  { name: 'waves', framework: 'Next.js', language: 'JavaScript', status: 'production', icon: 'waves' },
  { name: 'mesh', framework: 'Go', language: 'Go', status: 'production', icon: 'mesh' },
  { name: 'aurora', framework: 'Next.js', language: 'TypeScript', status: 'production', icon: 'aurora' },
] as const;

function randomSha(): string {
  return Array.from({ length: 7 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function successLog(name: string, sha: string): LogSeed[] {
  return [
    { level: 'dim', message: `Cloning github.com/aurora/${name} (Branch: main, Commit: ${sha})` },
    { level: 'success', message: 'Cloning completed in 1.2s' },
    { level: 'dim', message: 'Detected Node.js project' },
    { level: 'dim', message: 'Running "npm install"' },
    { level: 'info', message: 'added 142 packages in 5.8s' },
    { level: 'success', message: 'Dependencies installed' },
    { level: 'dim', message: 'Running "next build"' },
    { level: 'info', message: '   ▲ Next.js 16.3.0 (Turbopack)' },
    { level: 'success', message: '   ✓ Compiled successfully' },
    { level: 'dim', message: '   ✓ Collecting page data' },
    { level: 'dim', message: '   ✓ Generating static pages (12/12)' },
    { level: 'success', message: 'Build completed in 12.4s' },
    { level: 'dim', message: 'Uploading build outputs (24.1 MB)' },
    { level: 'success', message: 'Deployment ready · iad1' },
  ];
}

function failedLog(name: string, sha: string): LogSeed[] {
  return [
    ...successLog(name, sha).slice(0, 9),
    { level: 'error', message: '   ✗ Failed to compile.' },
    { level: 'error', message: '   Type error: Cannot find name "deplyo".' },
    { level: 'dim', message: '   ./app/page.tsx:42:7' },
    { level: 'error', message: 'Build failed in 11.3s' },
  ];
}

async function createDeployment(
  projectId: string,
  name: string,
  opts: { version: string; status: string; minutesAgo: number; durationMs: number | null; url: string | null },
) {
  const sha = randomSha();
  const createdAt = new Date(Date.now() - opts.minutesAgo * 60_000);
  const logs = opts.status === 'failed' ? failedLog(name, sha) : successLog(name, sha);

  const deployment = await prisma.deployment.create({
    data: {
      projectId,
      version: opts.version,
      status: opts.status,
      region: 'iad1',
      commit: JSON.stringify({ sha, message: 'Update deployment config', author: 'aurora', branch: 'main' }),
      durationMs: opts.durationMs,
      source: 'git',
      engine: 'simulated',
      url: opts.url,
      createdAt,
      finishedAt: opts.status === 'building' ? null : new Date(createdAt.getTime() + (opts.durationMs ?? 0)),
    },
  });

  await prisma.deploymentLog.createMany({
    data: logs.map((line, i) => ({
      deploymentId: deployment.id,
      seq: i,
      level: line.level,
      message: line.message,
      createdAt: new Date(createdAt.getTime() + i * 2000),
    })),
  });
}

async function main() {
  await prisma.deploymentLog.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.pin.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({ data: { name: 'Aurora' } });

  for (const p of PROJECTS) {
    const project = await prisma.project.create({
      data: {
        name: p.name,
        description: `${p.framework} project`,
        framework: p.framework,
        language: p.language,
        status: p.status,
        icon: p.icon,
        productionUrl: `${p.name}.vercel.app`,
        repo: `aurora/${p.name}`,
      },
    });

    const latestStatus = p.status === 'failed' ? 'failed' : 'ready';
    await createDeployment(project.id, p.name, {
      version: 'v1.4.0',
      status: latestStatus,
      minutesAgo: 12,
      durationMs: latestStatus === 'failed' ? 44_000 : 112_000,
      url: latestStatus === 'ready' ? `https://${p.name}.vercel.app` : null,
    });
    await createDeployment(project.id, p.name, {
      version: 'v1.3.0',
      status: 'ready',
      minutesAgo: 180,
      durationMs: 107_000,
      url: `https://${p.name}.vercel.app`,
    });
    await createDeployment(project.id, p.name, {
      version: 'v1.2.0',
      status: 'ready',
      minutesAgo: 1440,
      durationMs: 131_000,
      url: `https://${p.name}.vercel.app`,
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${PROJECTS.length} projects with deployments.`);
}

main()
  .catch(e => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
