import 'server-only';

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import type { Issue, IssuePriority, IssueStatus } from '@/types/issue';

const ISSUE_INCLUDE = {
  project: { select: { key: true, name: true } },
  assignee: { select: { id: true, name: true, avatarColor: true } },
  labels: { include: { label: { select: { name: true, color: true } } } },
} as const;

type IssueRow = {
  id: string;
  number: number;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  project: { key: string; name: string };
  assignee: { id: string; name: string; avatarColor: string } | null;
  labels: { label: { name: string; color: string } }[];
};

function mapIssue(row: IssueRow): Issue {
  return {
    id: row.id,
    key: `${row.project.key}-${row.number}`,
    number: row.number,
    title: row.title,
    status: row.status as IssueStatus,
    priority: row.priority as IssuePriority,
    projectId: row.projectId,
    projectKey: row.project.key,
    projectName: row.project.name,
    assignee: row.assignee,
    labels: row.labels.map(l => l.label),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function whereForView(view: string, userId: string) {
  switch (view) {
    case 'active':
      return { status: { in: ['in_progress', 'todo', 'in_review'] } };
    case 'backlog':
      return { status: 'backlog' };
    case 'mine':
      return { assigneeId: userId };
    case 'all':
      return {};
    default:
      // A project key (e.g. ENG)
      return { project: { key: view } };
  }
}

// Uncached, always-fresh read backing the SWR route + RSC seed — mutations must show live.
export async function getIssuesForView(view: string, userId: string): Promise<Issue[]> {
  const rows = await prisma.issue.findMany({
    where: whereForView(view, userId),
    include: ISSUE_INCLUDE,
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map(mapIssue);
}

export async function getIssueByKey(key: string): Promise<Issue> {
  const match = key.match(/^([A-Za-z]+)-(\d+)$/);
  if (!match) notFound();
  const row = await prisma.issue.findFirst({
    where: { project: { key: match[1].toUpperCase() }, number: Number(match[2]) },
    include: ISSUE_INCLUDE,
  });
  if (!row) notFound();
  return mapIssue(row);
}
