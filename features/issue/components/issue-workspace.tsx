'use client';

import Link from 'next/link';
import { Columns3, List, Maximize2, Plus, X } from 'lucide-react';
import { startTransition, useEffect, useRef, useState, ViewTransition } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { assignIssue, createIssue, updateIssuePriority, updateIssueStatus, updateIssueTitle } from '@/features/issue/issue-actions';
import { AssigneeSelect, PrioritySelect, StatusSelect } from '@/features/issue/components/issue-selects';
import { StatusIcon } from '@/features/issue/components/issue-glyphs';
import { IssueTabs } from '@/features/issue/components/issue-tabs';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RelativeTime } from '@/components/ui/relative-time';
import { cn } from '@/lib/utils';
import { BOARD_ORDER, STATUS_META, STATUS_ORDER, issuesKey, type Issue, type IssuePriority, type IssueStatus } from '@/types/issue';
import type { Project } from '@/types/project';
import type { Route } from 'next';
import type { User } from '@/types/user';

const fetcher = (url: string): Promise<Issue[]> => fetch(url).then(r => r.json());

type CurrentUser = { id: string; name: string; avatarColor: string };

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

function LabelChip({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">
      <span className={cn('h-1.5 w-1.5 rounded-full', LABEL_DOT[color] ?? 'bg-neutral-400')} />
      {name}
    </span>
  );
}

export function IssueWorkspace({
  view,
  teammates,
  projects,
  currentUser,
}: {
  view: string;
  teammates: User[];
  projects: Project[];
  currentUser: CurrentUser;
}) {
  const key = issuesKey(view);
  const { data: issues = [], mutate } = useSWR<Issue[]>(key, fetcher, {
    suspense: true,
    refreshInterval: 4000,
    revalidateOnFocus: true,
  });

  const [layout, setLayout] = useState<'list' | 'board'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = issues.find(i => i.id === selectedId) ?? null;

  // Flash rows whose status changed between renders (teammates' polled moves + your edits).
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
    // startTransition so the ViewTransition animates the card to its new position.
    startTransition(() => {
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
    });
  }

  const setStatus = (id: string, status: IssueStatus) => optimistic(id, { status }, () => updateIssueStatus(id, status));
  const setPriority = (id: string, priority: IssuePriority) => optimistic(id, { priority }, () => updateIssuePriority(id, priority));
  const setTitle = (id: string, title: string) => optimistic(id, { title }, () => updateIssueTitle(id, title));
  const setAssignee = (id: string, assigneeId: string | null) => {
    const t = teammates.find(u => u.id === assigneeId);
    const assignee = t ? { id: t.id, name: t.name, avatarColor: t.avatarColor } : null;
    optimistic(id, { assignee }, () => assignIssue(id, assigneeId));
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar view={view} projects={projects} layout={layout} onLayout={setLayout} onCreated={() => mutate()} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          {issues.length === 0 ? (
            <Empty />
          ) : layout === 'list' ? (
            <ListView
              issues={issues}
              teammates={teammates}
              flash={flash}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onStatus={setStatus}
              onPriority={setPriority}
              onAssignee={setAssignee}
            />
          ) : (
            <BoardView issues={issues} flash={flash} onSelect={setSelectedId} onStatus={setStatus} />
          )}
        </div>
      </div>

      {selected ? (
        <IssuePeek
          key={selected.id}
          issue={selected}
          teammates={teammates}
          currentUser={currentUser}
          onClose={() => setSelectedId(null)}
          onStatus={s => setStatus(selected.id, s)}
          onPriority={p => setPriority(selected.id, p)}
          onAssignee={id => setAssignee(selected.id, id)}
          onTitle={t => setTitle(selected.id, t)}
        />
      ) : null}
    </div>
  );
}

function Toolbar({
  view,
  projects,
  layout,
  onLayout,
  onCreated,
}: {
  view: string;
  projects: Project[];
  layout: 'list' | 'board';
  onLayout: (l: 'list' | 'board') => void;
  onCreated: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-1.5 sm:px-6">
      <Composer view={view} projects={projects} onCreated={onCreated} />
      <div className="flex items-center rounded-md border p-0.5">
        <ToolbarToggle active={layout === 'list'} label="List" onClick={() => onLayout('list')}>
          <List size={14} />
        </ToolbarToggle>
        <ToolbarToggle active={layout === 'board'} label="Board" onClick={() => onLayout('board')}>
          <Columns3 size={14} />
        </ToolbarToggle>
      </div>
    </div>
  );
}

function ToolbarToggle({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn('rounded p-1 transition-colors', active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground')}
    >
      {children}
    </button>
  );
}

function ListView({
  issues,
  teammates,
  flash,
  selectedId,
  onSelect,
  onStatus,
  onPriority,
  onAssignee,
}: {
  issues: Issue[];
  teammates: User[];
  flash: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onStatus: (id: string, s: IssueStatus) => void;
  onPriority: (id: string, p: IssuePriority) => void;
  onAssignee: (id: string, assigneeId: string | null) => void;
}) {
  const groups = STATUS_ORDER.map(status => ({ status, items: issues.filter(i => i.status === status) })).filter(g => g.items.length > 0);
  return (
    <>
      {groups.map(group => (
        <section key={group.status}>
          <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/85 px-4 py-1.5 backdrop-blur sm:px-6">
            <StatusIcon status={group.status} size={13} />
            <h3 className="text-xs font-medium">{STATUS_META[group.status].label}</h3>
            <span className="text-xs text-muted-foreground">{group.items.length}</span>
          </header>
          <ul>
            {group.items.map(issue => (
              <ViewTransition key={issue.id}>
                <li
                  onClick={() => onSelect(issue.id)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 border-b border-border/60 px-4 py-2 transition-colors hover:bg-accent/50 sm:px-6',
                    flash.has(issue.id) && 'flash-in',
                    selectedId === issue.id && 'bg-accent/60',
                  )}
                >
                  <div onClick={e => e.stopPropagation()}>
                    <PrioritySelect value={issue.priority} onSelect={p => onPriority(issue.id, p)} />
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    <StatusSelect value={issue.status} onSelect={s => onStatus(issue.id, s)} />
                  </div>
                  <span className="w-16 shrink-0 font-mono text-[11px] text-muted-foreground">{issue.key}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px]">{issue.title}</span>
                  <div className="hidden items-center gap-1 sm:flex">
                    {issue.labels.slice(0, 2).map(l => (
                      <LabelChip key={l.name} name={l.name} color={l.color} />
                    ))}
                  </div>
                  <span className="hidden w-14 shrink-0 text-right text-[11px] text-muted-foreground sm:inline">
                    <RelativeTime date={issue.updatedAt} />
                  </span>
                  <div onClick={e => e.stopPropagation()}>
                    <AssigneeSelect value={issue.assignee} teammates={teammates} onSelect={id => onAssignee(issue.id, id)} />
                  </div>
                </li>
              </ViewTransition>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function BoardView({
  issues,
  flash,
  onSelect,
  onStatus,
}: {
  issues: Issue[];
  flash: Set<string>;
  onSelect: (id: string) => void;
  onStatus: (id: string, s: IssueStatus) => void;
}) {
  const [dragOver, setDragOver] = useState<IssueStatus | null>(null);
  return (
    <div className="flex h-full gap-3 overflow-x-auto p-3 sm:p-4">
      {BOARD_ORDER.map(status => {
        const items = issues.filter(i => i.status === status);
        return (
          <div
            key={status}
            onDragOver={e => {
              e.preventDefault();
              setDragOver(status);
            }}
            onDragLeave={() => setDragOver(d => (d === status ? null : d))}
            onDrop={e => {
              e.preventDefault();
              setDragOver(null);
              const id = e.dataTransfer.getData('text/plain');
              if (id) onStatus(id, status);
            }}
            className={cn(
              'flex w-[280px] shrink-0 flex-col rounded-lg border bg-card/40 transition-colors',
              dragOver === status && 'border-brand/60 bg-accent/40',
            )}
          >
            <header className="flex items-center gap-2 border-b px-3 py-2">
              <StatusIcon status={status} size={13} />
              <h3 className="text-xs font-medium">{STATUS_META[status].label}</h3>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </header>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
              {items.map(issue => (
                <ViewTransition key={issue.id}>
                  <article
                    draggable
                    onDragStart={e => e.dataTransfer.setData('text/plain', issue.id)}
                    onClick={() => onSelect(issue.id)}
                    className={cn(
                      'cursor-pointer rounded-md border bg-card p-2.5 transition-colors hover:border-foreground/20',
                      flash.has(issue.id) && 'flash-in',
                    )}
                  >
                    <p className="mb-1 font-mono text-[10px] text-muted-foreground">{issue.key}</p>
                    <p className="text-[13px] leading-snug">{issue.title}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {issue.labels.slice(0, 2).map(l => (
                          <LabelChip key={l.name} name={l.name} color={l.color} />
                        ))}
                      </div>
                      {issue.assignee ? <Avatar name={issue.assignee.name} color={issue.assignee.avatarColor} size={18} /> : null}
                    </div>
                  </article>
                </ViewTransition>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IssuePeek({
  issue,
  teammates,
  currentUser,
  onClose,
  onStatus,
  onPriority,
  onAssignee,
  onTitle,
}: {
  issue: Issue;
  teammates: User[];
  currentUser: CurrentUser;
  onClose: () => void;
  onStatus: (s: IssueStatus) => void;
  onPriority: (p: IssuePriority) => void;
  onAssignee: (id: string | null) => void;
  onTitle: (t: string) => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[420px] flex-col border-l bg-card md:static md:z-0 md:max-w-[400px]">
        <header className="flex items-center justify-between border-b px-4 py-2.5">
          <span className="font-mono text-xs text-muted-foreground">{issue.key}</span>
          <div className="flex items-center gap-1">
            <Link
              href={`/issue/${issue.key}` as Route}
              prefetch
              aria-label="Open full page"
              className="rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <Maximize2 size={14} />
            </Link>
            <button onClick={onClose} aria-label="Close" className="rounded p-1 text-muted-foreground hover:text-foreground">
              <X size={15} />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <TitleEditor value={issue.title} onCommit={onTitle} />

          <dl className="space-y-2.5 text-[13px]">
            <Prop label="Status">
              <span className="flex items-center gap-2">
                <StatusSelect value={issue.status} onSelect={onStatus} />
                {STATUS_META[issue.status].label}
              </span>
            </Prop>
            <Prop label="Priority">
              <PrioritySelect value={issue.priority} onSelect={onPriority} />
            </Prop>
            <Prop label="Assignee">
              <span className="flex items-center gap-2">
                <AssigneeSelect value={issue.assignee} teammates={teammates} onSelect={onAssignee} />
                {issue.assignee?.name ?? <span className="text-muted-foreground">Unassigned</span>}
              </span>
            </Prop>
            {issue.labels.length > 0 ? (
              <Prop label="Labels">
                <div className="flex flex-wrap gap-1">
                  {issue.labels.map(l => (
                    <LabelChip key={l.name} name={l.name} color={l.color} />
                  ))}
                </div>
              </Prop>
            ) : null}
          </dl>

          <div className="border-t pt-4">
            <IssueTabs issueId={issue.id} currentUser={currentUser} />
          </div>
        </div>
      </aside>
    </>
  );
}

function TitleEditor({ value, onCommit }: { value: string; onCommit: (t: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  function commit() {
    const next = draft.trim();
    if (next && next !== value) onCommit(next);
  }
  return (
    <textarea
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      rows={2}
      className="w-full resize-none rounded-md bg-transparent text-base font-semibold tracking-tight outline-none focus:bg-accent/40"
    />
  );
}

function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-1 py-24 text-center">
      <p className="text-sm font-medium">No issues here</p>
      <p className="text-xs text-muted-foreground">Create one above to get started.</p>
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
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <Plus size={13} strokeWidth={2} /> New issue{target ? ` in ${target.key}` : ''}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-1 items-center gap-2 pr-3">
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
