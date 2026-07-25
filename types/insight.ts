import type { IssuePriority, IssueStatus } from '@/types/issue';

export type InsightsData = {
  total: number;
  open: number;
  inProgress: number;
  done: number;
  status: { status: IssueStatus; count: number }[];
  priority: { priority: IssuePriority; count: number }[];
  workload: { name: string; color: string; open: number }[];
  throughput: { label: string; count: number }[];
};

export const INSIGHTS_KEY = '/api/insights';
