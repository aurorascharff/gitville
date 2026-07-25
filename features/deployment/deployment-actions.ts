'use server';

import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { activeEngineKind, getDeployEngine } from '@/features/deployment/deploy-engine';
import { appendLog } from '@/features/deployment/deploy-engine/store';
import { verifyAuth } from '@/features/user/user-queries';
import type { ProjectIconName } from '@/types/project';

const ICONS: ProjectIconName[] = ['compass', 'feather', 'flame', 'orbit', 'prism', 'waves', 'mesh', 'aurora'];

const repoUrlSchema = z.string().trim().min(1, 'A repository URL is required');

function randomSha(): string {
  return Array.from({ length: 7 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function bumpVersion(previous?: string): string {
  if (!previous) return 'v1.0.0';
  const m = previous.match(/^v(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return 'v1.0.1';
  return `v${m[1]}.${m[2]}.${parseInt(m[3], 10) + 1}`;
}

function pickIcon(seed: string): ProjectIconName {
  const sum = [...seed].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ICONS[sum % ICONS.length];
}

// Accepts `https://github.com/owner/repo(.git)`, `git@github.com:owner/repo`, or `owner/repo`.
function parseRepo(input: string): { slug: string; name: string; url: string } | null {
  const clean = input.trim();
  const m =
    clean.match(/github\.com[/:]([^/\s]+)\/([^/\s#?]+?)(?:\.git)?(?:[#?].*)?$/i) ??
    clean.match(/^([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (!m) return null;
  const owner = m[1];
  const repo = m[2].replace(/\.git$/, '');
  return { slug: `${owner}/${repo}`, name: repo, url: `https://github.com/${owner}/${repo}` };
}

// Inserts a `building` deployment, schedules the engine to run after the response, and
// invalidates the cached lists so the new row shows up. Returns the new deployment id.
async function startDeployment(
  project: { id: string; name: string },
  repoUrl: string,
  source: 'git' | 'manual',
): Promise<string> {
  const latest = await prisma.deployment.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: 'desc' },
    select: { version: true },
  });

  const deployment = await prisma.deployment.create({
    data: {
      projectId: project.id,
      version: bumpVersion(latest?.version),
      status: 'building',
      region: 'iad1',
      commit: JSON.stringify({ sha: randomSha(), message: 'Triggered deployment', author: 'you', branch: 'main' }),
      source,
      engine: activeEngineKind(),
      url: null,
    },
  });

  await appendLog(deployment.id, 'dim', 'Deployment queued');

  const engine = getDeployEngine();
  after(() =>
    engine.run({ deploymentId: deployment.id, projectId: project.id, projectName: project.name, repoUrl }),
  );

  updateTag(`deployments-${project.id}`);
  updateTag('recent-deployments');
  return deployment.id;
}

export async function redeployProject(projectId: string) {
  await verifyAuth();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { ok: false as const, error: 'Project not found' };
  const repoUrl = `https://github.com/${project.repo}`;
  const deploymentId = await startDeployment(project, repoUrl, 'manual');
  redirect(`/projects/${projectId}/deployments/${deploymentId}`);
}

export async function createDeploymentFromUrl(formData: FormData) {
  await verifyAuth();

  const parsed = repoUrlSchema.safeParse(formData.get('repoUrl'));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  const repo = parseRepo(parsed.data);
  if (!repo) return { ok: false as const, error: 'Enter a valid GitHub repo URL (e.g. vercel/next.js).' };

  // Reuse the project for this repo if it exists, otherwise create it.
  let project = await prisma.project.findFirst({ where: { repo: repo.slug } });
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: repo.name,
        description: `Imported from ${repo.slug}`,
        framework: 'Next.js',
        language: 'TypeScript',
        status: 'building',
        icon: pickIcon(repo.slug),
        productionUrl: `${repo.name}.vercel.app`,
        repo: repo.slug,
      },
    });
    updateTag('projects');
  }

  const deploymentId = await startDeployment(project, repo.url, 'git');
  redirect(`/projects/${project.id}/deployments/${deploymentId}`);
}
