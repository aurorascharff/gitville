'use client';

import { Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { assignIssue, createIssue, updateIssuePriority, updateIssueStatus } from '@/features/issue/issue-actions';
import { AssigneeSelect, PrioritySelect, StatusSelect } from '@/features/issue/components/issue-selects';
import { StatusIcon } from '@/features/issue/components/issue-glyphs';
import { Avatar, EmptyAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RelativeTime } from '@/components/ui/relative-time';
import { cn } from '@/lib/utils';
import { STATUS_META, STATUS_ORDER, issuesKey, type Issue, type IssuePriority, type IssueStatus } from '@/types/issue';
import type { Project } from '@/types/project';
import type { User } from '@/types/user';

const fetcher = (url: string): Promise<Issue[]> => fetch(url).then(r => r.json());

const LABEL_DOT: Record<string, string> = {
  red: 'bg-red-400',
  violet: 'bg-violet-400',
  blue: 'bg-blue-400',
  amber: 'bg-amber-400',
  emerald: 'bg-emerald-400',
  gray: 'bg-neutral-400',
  rose: 'bg-rose-400',
  cyan: 'bg-cyan-400',
  indigo: 'bg-indigo-400',
};

export function IssueWorkspace({ view, teammates, projects }: { view: string; teammates: User[]; projects: Project[] }) {
  const key = issuesKey(view);
  const { data: issues = [], mutate } = useSWR<Issue[]>(key, fetcher, {
    suspense: true,
    refreshInterval: 4000,
    revalidateOnFocus: true,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = issues.find(i => i.id === selectedId) ?? null;

  // Flash rows whose status changed between polls (teammates moving things, or your own edits).
  const prev = useRef<Record<string, string>>({});
  const [flash, setFlash] = useState<Set<string>>(new Set());
  useEffect(() => {
    const next: Record<string, string> = {};
    const changed = new Set<string>();
    for (const i of issues) {
      next[i.id] = i.status;
      if (prev.current[i.id] && prev.current[i.id] !== i.status) changed.add(i.id);
    }
    prev.current = next;
    if (changed.size) {
      setFlash(changed);
      const t = setTimeout(() => setFlash(new Set()), 1200);
      return () => clearTimeout(t);
    }
  }, [issues]);

  function optimistic(id: string, patch: Partial<Issue>, action: () => Promise<{ ok: boolean; error?: string }>) {
    void mutate(
      async () => {
        const res = await action();
        if (!res.ok) {
          toast.error(res.error ?? 'Something went wrong');
          throw new Error(res.error);
        }
        return fetcher(key);
      },
      { optimisticData: issues.map(i => (i.id === id ? { ...i, ...patch } : i)), rollbackOnError: true, revalidate: true },
    );
  }

  const setStatus = (id: string, status: IssueStatus) => optimistic(id, { status }, () => updateIssueStatus(id, status));
  const setPriority = (id: string, priority: IssuePriority) => optimistic(id, { priority }, () => updateIssuePriority(id, priority));
  const setAssignee = (id: string, assigneeId: string | null) => {
    const t = teammates.find(u => u.id === assigneeId);
    const assignee = t ? { id: t.id, name: t.name, avatarColor: t.avatarColor } : null;
    optimistic(id, { assignee }, () => assignIssue(id, assigneeId));
  };

  const groups = STATUS_ORDER.map(status => ({ status, items: issues.filter(i => i.status === status) })).filter(g => g.items.length > 0);

  return (
    <div className="flex min-h-0 flex-1">
      <div className="min-w-0 flex-1 overflow-y-auto">
        <Composer view={view} projects={projects} onCreated={() => mutate()} />
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-24 text-center">
            <p className="text-sm font-medium">No issues here</p>
            <p className="text-xs text-muted-foreground">Create one above to get started.</p>
          </div>
        ) : (
          groups.map(group => (
            <section key={group.status}>
              <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/80 px-4 py-1.5 backdrop-blur sm:px-6">
                <StatusIcon status={group.status} size={13} />
                <h3 className="text-xs font-medium">{STATUS_META[group.status].label}</h3>
                <span className="text-xs text-muted-foreground">{group.items.length}</span>
              </header>
              <ul>
                {group.items.map(issue => (
                  <li
                    key={issue.id}
                    onClick={() => setSelectedId(issue.id)}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 border-b border-border/60 px-4 py-2 transition-colors hover:bg-accent/50 sm:px-6',
                      flash.has(issue.id) && 'flash-in',
                      selectedId === issue.id && 'bg-accent/60',
                    )}
                  >
                    <div onClick={e => e.stopPropagation()}>
                      <PrioritySelectCell issue={issue} onSelect={p => setPriority(issue.id, p)} />
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <StatusSelect value={issue.status} onSelect={s => setStatus(issue.id, s)} />
                    </div>
                    <span className="w-16 shrink-0 font-mono text-[11px] text-muted-foreground">{issue.key}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px]">{issue.title}</span>
                    <div className="hidden items-center gap-1 sm:flex">
                      {issue.labels.slice(0, 2).map(l => (
                        <span key={l.name} className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          <span className={cn('h-1.5 w-1.5 rounded-full', LABEL_DOT[l.color] ?? 'bg-neutral-400')} />
                          {l.name}
                        </span>
                      ))}
                    </div>
                    <span className="hidden w-14 shrink-0 text-right text-[11px] text-muted-foreground sm:inline">
                      <RelativeTime date={issue.updatedAt} />
                    </span>
                    <div onClick={e => e.stopPropagation()}>
                      <AssigneeSelect value={issue.assignee} teammates={teammates} onSelect={id => setAssignee(issue.id, id)} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {selected ? (
        <IssuePeek
          issue={selected}
          teammates={teammates}
          onClose={() => setSelectedId(null)}
          onStatus={s => setStatus(selected.id, s)}
          onPriority={p => setPriority(selected.id, p)}
          onAssignee={id => setAssignee(selected.id, id)}
        />
      ) : null}
    </div>
  );
}

function PrioritySelectCell({ issue, onSelect }: { issue: Issue; onSelect: (p: IssuePriority) => void }) {
  return <PrioritySelect value={issue.priority} onSelect={onSelect} />;
}

function IssuePeek({
  issue,
  teammates,
  onClose,
  onStatus,
  onPriority,
  onAssignee,
}: {
  issue: Issue;
  teammates: User[];
  onClose: () => void;
  onStatus: (s: IssueStatus) => void;
  onPriority: (p: IssuePriority) => void;
  onAssignee: (id: string | null) => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[400px] flex-col border-l bg-card md:static md:z-0 md:max-w-[380px]">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-mono text-xs text-muted-foreground">{issue.key}</span>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-muted-foreground hover:text-foreground">
            <X size={15} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-base font-semibold tracking-tight">{issue.title}</h2>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Opened <RelativeTime date={issue.createdAt} /> · {issue.projectName}
          </p>

          <dl className="mt-6 space-y-3 text-[13px]">
            <Property label="Status">
              <span className="flex items-center gap-2">
                <StatusSelect value={issue.status} onSelect={onStatus} />
                {STATUS_META[issue.status].label}
              </span>
            </Property>
            <Property label="Priority">
              <PrioritySelect value={issue.priority} onSelect={onPriority} />
            </Property>
            <Property label="Assignee">
              <span className="flex items-center gap-2">
                <AssigneeSelect value={issue.assignee} teammates={teammates} onSelect={onAssignee} />
                {issue.assignee?.name ?? <span className="text-muted-foreground">Unassigned</span>}
              </span>
            </Property>
            {issue.labels.length > 0 ? (
              <Property label="Labels">
                <div className="flex flex-wrap gap-1">
                  {issue.labels.map(l => (
                    <span key={l.name} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                      <span className={cn('h-1.5 w-1.5 rounded-full', LABEL_DOT[l.color] ?? 'bg-neutral-400')} />
                      {l.name}
                    </span>
                  ))}
                </div>
              </Property>
            ) : null}
          </dl>
        </div>
      </aside>
    </>
  );
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}

function Composer({ view, projects, onCreated }: { view: string; projects: Project[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [pending, setPending] = useState(false);
  const target = projects.find(p => p.key === view) ?? projects[0];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !target) return;
    setPending(true);
    const res = await createIssue({ projectId: target.id, title });
    setPending(false);
    if (res.ok) {
      setTitle('');
      setOpen(false);
      onCreated();
      toast.success(`Created ${res.key}`);
    } else {
      toast.error(res.error);
    }
  }

  if (!open) {
    return (
      <div className="flex items-center justify-between px-4 py-2 sm:px-6">
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <Plus size={13} strokeWidth={2} /> New issue{target ? ` in ${target.key}` : ''}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 border-b px-4 py-2 sm:px-6">
      <Input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder={`New issue in ${target?.key ?? ''}…`} className="flex-1" />
      <Button type="submit" size="sm" disabled={pending || !title.trim()}>
        Create
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}
