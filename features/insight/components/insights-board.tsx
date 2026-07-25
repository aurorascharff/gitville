'use client';

import useSWR from 'swr';
import { Avatar } from '@/components/ui/avatar';
import { PriorityIcon } from '@/features/issue/components/issue-glyphs';
import { PRIORITY_META, STATUS_META, type IssuePriority, type IssueStatus } from '@/types/issue';
import { INSIGHTS_KEY, type InsightsData } from '@/types/insight';

const fetcher = (url: string): Promise<InsightsData> => fetch(url).then(r => r.json());

// Status is a reserved state palette (shipped with labels + counts, never color-alone).
const STATUS_COLOR: Record<IssueStatus, string> = {
  backlog: 'color-mix(in oklch, var(--color-muted-foreground) 45%, var(--color-card))',
  todo: 'var(--color-muted-foreground)',
  in_progress: 'var(--color-warning)',
  in_review: 'var(--color-brand)',
  done: 'var(--color-success)',
  canceled: 'color-mix(in oklch, var(--color-muted-foreground) 30%, var(--color-card))',
};

const grow = 'transition-all duration-500 ease-out';

export function InsightsBoard() {
  const { data } = useSWR<InsightsData>(INSIGHTS_KEY, fetcher, { suspense: true, refreshInterval: 5000, revalidateOnFocus: true });
  if (!data) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Open" value={data.open} />
        <Stat label="In progress" value={data.inProgress} accent />
        <Stat label="Done" value={data.done} />
        <Stat label="Total issues" value={data.total} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card title="Status">
          <StackedStatus data={data.status} total={data.total} />
        </Card>
        <Card title="Completed · last 7 days">
          <Throughput data={data.throughput} />
        </Card>
        <Card title="Priority">
          <BarList
            items={data.priority.map(p => ({ key: p.priority, label: PRIORITY_META[p.priority].label, count: p.count, icon: <PriorityIcon priority={p.priority as IssuePriority} size={13} /> }))}
          />
        </Card>
        <Card title="Workload · open per assignee">
          {data.workload.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No open issues assigned.</p>
          ) : (
            <BarList items={data.workload.map(w => ({ key: w.name, label: w.name, count: w.open, icon: <Avatar name={w.name} color={w.color} size={18} /> }))} />
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums tracking-tight ${accent ? 'text-brand' : ''}`}>{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

function StackedStatus({ data, total }: { data: { status: IssueStatus; count: number }[]; total: number }) {
  const denom = total || 1;
  const shown = data.filter(d => d.count > 0);
  return (
    <div className="space-y-3">
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
        {shown.map(d => (
          <div
            key={d.status}
            className={grow}
            style={{ width: `${(d.count / denom) * 100}%`, background: STATUS_COLOR[d.status], borderRadius: 3 }}
            title={`${STATUS_META[d.status].label}: ${d.count}`}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
        {data.map(d => (
          <li key={d.status} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: STATUS_COLOR[d.status] }} />
            <span className="flex-1 text-muted-foreground">{STATUS_META[d.status].label}</span>
            <span className="tabular-nums">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarList({ items }: { items: { key: string; label: string; count: number; icon?: React.ReactNode }[] }) {
  const max = Math.max(1, ...items.map(i => i.count));
  return (
    <ul className="space-y-2.5">
      {items.map(item => (
        <li key={item.key} className="flex items-center gap-2.5 text-[13px]">
          <span className="flex w-24 shrink-0 items-center gap-1.5 truncate">
            {item.icon}
            <span className="truncate">{item.label}</span>
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <span className={`block h-full rounded-full bg-brand ${grow}`} style={{ width: `${(item.count / max) * 100}%` }} title={`${item.label}: ${item.count}`} />
          </span>
          <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">{item.count}</span>
        </li>
      ))}
    </ul>
  );
}

function Throughput({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.count));
  return (
    <div className="flex h-32 items-end gap-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-full w-full items-end">
            <div
              className={`w-full rounded-t-[3px] bg-success/80 ${grow}`}
              style={{ height: `${Math.max(3, (d.count / max) * 100)}%` }}
              title={`${d.label}: ${d.count} completed`}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
