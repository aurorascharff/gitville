import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const USERS = [
  { name: 'Aurora', avatarColor: 'violet', role: 'Founding Engineer' },
  { name: 'Mei', avatarColor: 'cyan', role: 'Staff Engineer' },
  { name: 'Diego', avatarColor: 'amber', role: 'Design Engineer' },
  { name: 'Priya', avatarColor: 'emerald', role: 'Platform Lead' },
  { name: 'Sam', avatarColor: 'rose', role: 'Product Engineer' },
  { name: 'Jordan', avatarColor: 'blue', role: 'Engineer' },
];

const PROJECTS = [
  { name: 'Core', key: 'ENG', color: 'violet', icon: 'cpu', description: 'The app itself' },
  { name: 'Design System', key: 'DS', color: 'cyan', icon: 'shapes', description: 'Components + tokens' },
  { name: 'Platform', key: 'PLAT', color: 'emerald', icon: 'server', description: 'Infra, builds, data' },
  { name: 'Growth', key: 'GRO', color: 'amber', icon: 'trending-up', description: 'Onboarding + funnels' },
];

const LABELS = [
  { name: 'bug', color: 'red' },
  { name: 'feature', color: 'violet' },
  { name: 'improvement', color: 'blue' },
  { name: 'perf', color: 'amber' },
  { name: 'a11y', color: 'emerald' },
  { name: 'chore', color: 'gray' },
  { name: 'flaky', color: 'rose' },
  { name: 'good first issue', color: 'cyan' },
  { name: 'dx', color: 'indigo' },
  { name: 'security', color: 'red' },
];

type Spec = {
  title: string;
  project: string;
  status: string;
  priority: string;
  assignee?: string;
  labels?: string[];
  minutesAgo: number;
};

const ISSUES: Spec[] = [
  { title: 'Hydration mismatch flashes on the board during first paint', project: 'ENG', status: 'in_progress', priority: 'high', assignee: 'Aurora', labels: ['bug'], minutesAgo: 6 },
  { title: 'SWR cache never evicts after a tab is backgrounded for 30m', project: 'ENG', status: 'in_progress', priority: 'urgent', assignee: 'Mei', labels: ['bug', 'perf'], minutesAgo: 14 },
  { title: 'Optimistic status change keeps the toast after a rollback', project: 'ENG', status: 'in_review', priority: 'medium', assignee: 'Sam', labels: ['bug'], minutesAgo: 41 },
  { title: 'Add a ⌘K command menu for jumping between issues', project: 'ENG', status: 'todo', priority: 'high', assignee: 'Diego', labels: ['feature', 'dx'], minutesAgo: 90 },
  { title: 'Keyboard nav skips the last row in a status group', project: 'ENG', status: 'todo', priority: 'medium', assignee: 'Jordan', labels: ['bug', 'a11y'], minutesAgo: 130 },
  { title: 'Virtualize the issue list past ~200 rows', project: 'ENG', status: 'backlog', priority: 'low', labels: ['perf'], minutesAgo: 300 },
  { title: 'Persist board vs list preference per project', project: 'ENG', status: 'backlog', priority: 'low', assignee: 'Sam', labels: ['improvement'], minutesAgo: 520 },
  { title: 'Drag-to-reorder within a status column', project: 'ENG', status: 'backlog', priority: 'medium', labels: ['feature'], minutesAgo: 900 },
  { title: 'Issue detail: render markdown in descriptions', project: 'ENG', status: 'done', priority: 'medium', assignee: 'Diego', labels: ['feature'], minutesAgo: 1500 },

  { title: 'Dark-mode flash before the theme cookie resolves', project: 'DS', status: 'in_progress', priority: 'high', assignee: 'Diego', labels: ['bug', 'a11y'], minutesAgo: 22 },
  { title: 'Muted-foreground fails WCAG AA contrast in light mode', project: 'DS', status: 'todo', priority: 'high', assignee: 'Priya', labels: ['a11y'], minutesAgo: 75 },
  { title: 'Shimmer skeletons should match final row heights exactly', project: 'DS', status: 'todo', priority: 'low', assignee: 'Diego', labels: ['improvement'], minutesAgo: 160 },
  { title: 'Ship presence avatars in the header', project: 'DS', status: 'in_review', priority: 'medium', assignee: 'Mei', labels: ['feature'], minutesAgo: 55 },
  { title: 'Priority icons need a colorblind-safe palette', project: 'DS', status: 'backlog', priority: 'medium', labels: ['a11y', 'good first issue'], minutesAgo: 640 },
  { title: 'Avatar initials clip with 3-word names', project: 'DS', status: 'done', priority: 'low', assignee: 'Sam', labels: ['bug', 'good first issue'], minutesAgo: 2100 },

  { title: 'Turbopack HMR drops updates when a file is renamed', project: 'PLAT', status: 'in_progress', priority: 'high', assignee: 'Priya', labels: ['bug', 'dx'], minutesAgo: 30 },
  { title: '`use cache` tag invalidation misses nested layouts', project: 'PLAT', status: 'todo', priority: 'urgent', assignee: 'Mei', labels: ['bug'], minutesAgo: 48 },
  { title: 'Flaky e2e: login redirect races the session cookie', project: 'PLAT', status: 'todo', priority: 'high', assignee: 'Jordan', labels: ['flaky'], minutesAgo: 110 },
  { title: 'Migrate to Prisma 7 driver adapters', project: 'PLAT', status: 'done', priority: 'high', assignee: 'Priya', labels: ['chore'], minutesAgo: 1800 },
  { title: 'Cache the Neon pool across HMR in dev', project: 'PLAT', status: 'backlog', priority: 'medium', labels: ['perf', 'dx'], minutesAgo: 700 },
  { title: 'Rotate the leaked demo token and add a secret scanner', project: 'PLAT', status: 'todo', priority: 'urgent', assignee: 'Priya', labels: ['security'], minutesAgo: 200 },
  { title: 'Bundle size regressed 38kb after the icons refactor', project: 'PLAT', status: 'in_review', priority: 'medium', assignee: 'Aurora', labels: ['perf'], minutesAgo: 66 },

  { title: 'Empty state for a project with zero issues', project: 'GRO', status: 'todo', priority: 'low', assignee: 'Sam', labels: ['improvement', 'good first issue'], minutesAgo: 240 },
  { title: 'First-run checklist: create your first issue', project: 'GRO', status: 'backlog', priority: 'medium', labels: ['feature'], minutesAgo: 480 },
  { title: 'Invite-teammate flow drops the redirect on mobile Safari', project: 'GRO', status: 'in_progress', priority: 'medium', assignee: 'Jordan', labels: ['bug'], minutesAgo: 18 },
  { title: 'A/B the onboarding headline copy', project: 'GRO', status: 'backlog', priority: 'low', labels: ['improvement'], minutesAgo: 1200 },
  { title: 'Canceled: sunset the old activity endpoint', project: 'GRO', status: 'canceled', priority: 'none', assignee: 'Mei', labels: ['chore'], minutesAgo: 3000 },
];

const EVENTS = [
  { type: 'issue.status', actor: 'Mei', message: 'moved ENG-2 to In Progress', project: 'ENG', minutesAgo: 3 },
  { type: 'issue.created', actor: 'Diego', message: 'opened DS-4 · Ship presence avatars', project: 'DS', minutesAgo: 9 },
  { type: 'issue.assigned', actor: 'Priya', message: 'assigned PLAT-6 to herself', project: 'PLAT', minutesAgo: 17 },
  { type: 'issue.priority', actor: 'Aurora', message: 'raised ENG-2 to Urgent', project: 'ENG', minutesAgo: 24 },
  { type: 'issue.commented', actor: 'Sam', message: 'commented on ENG-3', project: 'ENG', minutesAgo: 38 },
];

async function main() {
  await prisma.event.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.notificationRead.deleteMany();
  await prisma.issueLabel.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.label.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const users = new Map<string, string>();
  for (const u of USERS) {
    const created = await prisma.user.create({ data: u });
    users.set(u.name, created.id);
  }

  const projects = new Map<string, string>();
  for (const p of PROJECTS) {
    const created = await prisma.project.create({ data: p });
    projects.set(p.key, created.id);
  }

  const labels = new Map<string, string>();
  for (const l of LABELS) {
    const created = await prisma.label.create({ data: l });
    labels.set(l.name, created.id);
  }

  const numbers = new Map<string, number>();
  for (const spec of ISSUES) {
    const n = (numbers.get(spec.project) ?? 0) + 1;
    numbers.set(spec.project, n);
    const createdAt = new Date(Date.now() - spec.minutesAgo * 60_000);
    await prisma.issue.create({
      data: {
        number: n,
        projectId: projects.get(spec.project)!,
        title: spec.title,
        status: spec.status,
        priority: spec.priority,
        assigneeId: spec.assignee ? users.get(spec.assignee) : null,
        createdAt,
        updatedAt: createdAt,
        labels: spec.labels ? { create: spec.labels.map(name => ({ labelId: labels.get(name)! })) } : undefined,
      },
    });
  }

  for (const e of EVENTS) {
    await prisma.event.create({
      data: {
        type: e.type,
        actorName: e.actor,
        message: e.message,
        projectId: projects.get(e.project) ?? null,
        createdAt: new Date(Date.now() - e.minutesAgo * 60_000),
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${USERS.length} teammates, ${PROJECTS.length} projects, ${ISSUES.length} issues.`);
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
