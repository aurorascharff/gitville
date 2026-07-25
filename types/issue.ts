export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'canceled';
export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export const STATUS_ORDER: IssueStatus[] = ['in_progress', 'todo', 'in_review', 'backlog', 'done', 'canceled'];
export const BOARD_ORDER: IssueStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];

export const STATUS_META: Record<IssueStatus, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: 'var(--color-muted-foreground)' },
  todo: { label: 'Todo', color: 'var(--color-muted-foreground)' },
  in_progress: { label: 'In Progress', color: 'var(--color-warning)' },
  in_review: { label: 'In Review', color: 'var(--color-brand)' },
  done: { label: 'Done', color: 'var(--color-success)' },
  canceled: { label: 'Canceled', color: 'var(--color-muted-foreground)' },
};

export const PRIORITY_ORDER: IssuePriority[] = ['urgent', 'high', 'medium', 'low', 'none'];
export const PRIORITY_META: Record<IssuePriority, { label: string }> = {
  urgent: { label: 'Urgent' },
  high: { label: 'High' },
  medium: { label: 'Medium' },
  low: { label: 'Low' },
  none: { label: 'No priority' },
};

export type IssueAssignee = { id: string; name: string; avatarColor: string };
export type IssueLabelChip = { name: string; color: string };

// Serializable issue used by both RSC and the SWR client cache (dates are ISO strings).
export type Issue = {
  id: string;
  key: string; // e.g. ENG-142
  number: number;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  projectId: string;
  projectKey: string;
  projectName: string;
  assignee: IssueAssignee | null;
  labels: IssueLabelChip[];
  createdAt: string;
  updatedAt: string;
};

export const issuesKey = (view: string) => `/api/issues?view=${view}`;
