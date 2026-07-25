'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { emitEvent } from '@/features/activity/emit-event';
import { getCurrentUser } from '@/features/user/user-queries';
import { PRIORITY_META, STATUS_META, type IssuePriority, type IssueStatus } from '@/types/issue';

async function loadIssue(issueId: string) {
  return prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, number: true, projectId: true, project: { select: { key: true, name: true } } },
  });
}

function keyOf(issue: { number: number; project: { key: string } }): string {
  return `${issue.project.key}-${issue.number}`;
}

export async function updateIssueStatus(issueId: string, status: IssueStatus) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Not signed in' };
  const issue = await loadIssue(issueId);
  if (!issue) return { ok: false as const, error: 'Issue not found' };

  await prisma.issue.update({ where: { id: issueId }, data: { status } });
  await emitEvent({
    type: 'issue.status',
    actorName: user.name,
    message: `moved ${keyOf(issue)} to ${STATUS_META[status].label}`,
    projectId: issue.projectId,
    issueId,
    issueKey: keyOf(issue),
  });
  return { ok: true as const };
}

export async function updateIssuePriority(issueId: string, priority: IssuePriority) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Not signed in' };
  const issue = await loadIssue(issueId);
  if (!issue) return { ok: false as const, error: 'Issue not found' };

  await prisma.issue.update({ where: { id: issueId }, data: { priority } });
  await emitEvent({
    type: 'issue.priority',
    actorName: user.name,
    message: `set ${keyOf(issue)} to ${PRIORITY_META[priority].label}`,
    projectId: issue.projectId,
    issueId,
    issueKey: keyOf(issue),
  });
  return { ok: true as const };
}

export async function assignIssue(issueId: string, assigneeId: string | null) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Not signed in' };
  const issue = await loadIssue(issueId);
  if (!issue) return { ok: false as const, error: 'Issue not found' };

  const assignee = assigneeId ? await prisma.user.findUnique({ where: { id: assigneeId }, select: { name: true } }) : null;
  await prisma.issue.update({ where: { id: issueId }, data: { assigneeId } });
  await emitEvent({
    type: 'issue.assigned',
    actorName: user.name,
    message: assignee ? `assigned ${keyOf(issue)} to ${assignee.name}` : `unassigned ${keyOf(issue)}`,
    projectId: issue.projectId,
    issueId,
    issueKey: keyOf(issue),
  });
  return { ok: true as const };
}

const titleSchema = z.string().trim().min(1, 'Give it a title').max(160, 'Title is too long');

export async function createIssue(input: { projectId: string; title: string; priority?: IssuePriority; assigneeId?: string | null }) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Not signed in' };
  const parsed = titleSchema.safeParse(input.title);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  const project = await prisma.project.findUnique({ where: { id: input.projectId }, select: { key: true } });
  if (!project) return { ok: false as const, error: 'Project not found' };

  // Next number for this project.
  const last = await prisma.issue.findFirst({
    where: { projectId: input.projectId },
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  const number = (last?.number ?? 0) + 1;

  const issue = await prisma.issue.create({
    data: {
      number,
      projectId: input.projectId,
      title: parsed.data,
      status: 'todo',
      priority: input.priority ?? 'none',
      assigneeId: input.assigneeId ?? null,
    },
  });

  const key = `${project.key}-${number}`;
  await emitEvent({
    type: 'issue.created',
    actorName: user.name,
    message: `opened ${key} · ${parsed.data.slice(0, 60)}`,
    projectId: input.projectId,
    issueId: issue.id,
    issueKey: key,
  });
  return { ok: true as const, id: issue.id, key };
}
