import 'server-only';

import { prisma } from '@/lib/db';
import { BOARD_ORDER, PRIORITY_ORDER, type IssuePriority, type IssueStatus } from '@/types/issue';
import type { InsightsData } from '@/types/insight';

const DAY_MS = 86_400_000;

// Uncached live aggregate over the current issues — recomputes on every poll, so the
// charts move as teammates (and you) change the board.
export async function getInsights(): Promise<InsightsData> {
  const issues = await prisma.issue.findMany({
    select: { status: true, priority: true, updatedAt: true, assignee: { select: { name: true, avatarColor: true } } },
  });

  const statusCount = new Map<string, number>();
  const priorityCount = new Map<string, number>();
  const workload = new Map<string, { name: string; color: string; open: number }>();
  let open = 0;
  let inProgress = 0;
  let done = 0;

  for (const i of issues) {
    statusCount.set(i.status, (statusCount.get(i.status) ?? 0) + 1);
    priorityCount.set(i.priority, (priorityCount.get(i.priority) ?? 0) + 1);
    const terminal = i.status === 'done' || i.status === 'canceled';
    if (!terminal) open++;
    if (i.status === 'in_progress') inProgress++;
    if (i.status === 'done') done++;
    if (!terminal && i.assignee) {
      const w = workload.get(i.assignee.name) ?? { name: i.assignee.name, color: i.assignee.avatarColor, open: 0 };
      w.open++;
      workload.set(i.assignee.name, w);
    }
  }

  // Completed per day for the last 7 days (by updatedAt of done issues).
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const throughput = Array.from({ length: 7 }, (_, idx) => {
    const dayStart = startOfToday.getTime() - (6 - idx) * DAY_MS;
    const dayEnd = dayStart + DAY_MS;
    const count = issues.filter(i => i.status === 'done' && i.updatedAt.getTime() >= dayStart && i.updatedAt.getTime() < dayEnd).length;
    const label = new Date(dayStart).toLocaleDateString('en-US', { weekday: 'short' });
    return { label, count };
  });
  void now;

  return {
    total: issues.length,
    open,
    inProgress,
    done,
    status: BOARD_ORDER.concat('canceled' as IssueStatus).map(status => ({ status, count: statusCount.get(status) ?? 0 })),
    priority: PRIORITY_ORDER.map(priority => ({ priority, count: priorityCount.get(priority) ?? 0 })),
    workload: [...workload.values()].sort((a, b) => b.open - a.open),
    throughput,
  };
}
