import 'server-only';

import { prisma } from '@/lib/db';
import { emitEvent } from '@/features/activity/emit-event';
import { STATUS_META, type IssueStatus } from '@/types/issue';

const TEAMMATES = ['Mei', 'Diego', 'Priya', 'Sam', 'Jordan'];
const FORWARD: Partial<Record<IssueStatus, IssueStatus>> = {
  todo: 'in_progress',
  in_progress: 'in_review',
  in_review: 'done',
};

// Demo liveness: occasionally advance a random in-flight issue as a teammate, so the board
// visibly moves on its own (and the SWR poll flashes the change) even with one person here.
export async function maybeSimulateActivity(): Promise<void> {
  if (Math.random() > 0.35) return;

  const inFlight = await prisma.issue.findMany({
    where: { status: { in: ['todo', 'in_progress', 'in_review'] } },
    select: { id: true, number: true, status: true, projectId: true, project: { select: { key: true } } },
    take: 60,
  });
  if (inFlight.length === 0) return;

  const issue = inFlight[Math.floor(Math.random() * inFlight.length)];
  const next = FORWARD[issue.status as IssueStatus];
  if (!next) return;

  const actor = TEAMMATES[Math.floor(Math.random() * TEAMMATES.length)];
  const key = `${issue.project.key}-${issue.number}`;
  await prisma.issue.update({ where: { id: issue.id }, data: { status: next } });
  await emitEvent({
    type: 'issue.status',
    actorName: actor,
    message: `moved ${key} to ${STATUS_META[next].label}`,
    projectId: issue.projectId,
    issueId: issue.id,
    issueKey: key,
  });
}
