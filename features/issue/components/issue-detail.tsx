'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { startTransition, useEffect, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { assignIssue, updateIssuePriority, updateIssueStatus, updateIssueTitle } from '@/features/issue/issue-actions';
import { AssigneeSelect, PrioritySelect, StatusSelect } from '@/features/issue/components/issue-selects';
import { IssueTabs } from '@/features/issue/components/issue-tabs';
import { RelativeTime } from '@/components/ui/relative-time';
import { cn } from '@/lib/utils';
import { STATUS_META, issueKeyUrl, type Issue, type IssuePriority, type IssueStatus } from '@/types/issue';
import type { User } from '@/types/user';

const fetcher = (url: string): Promise<Issue> => fetch(url).then(r => r.json());
const LABEL_DOT: Record<string, string> = {
  red: 'bg-red-400', violet: 'bg-violet-400', blue: 'bg-blue-400', amber: 'bg-amber-400',
  emerald: 'bg-emerald-400', gray: 'bg-neutral-400', rose: 'bg-rose-400', cyan: 'bg-cyan-400', indigo: 'bg-indigo-400',
};

type CurrentUser = { id: string; name: string; avatarColor: string };

export function IssueDetail({ initial, teammates, currentUser }: { initial: Issue; teammates: User[]; currentUser: CurrentUser }) {
  const key = issueKeyUrl(initial.key);
  const { data: issue = initial, mutate } = useSWR<Issue>(key, fetcher, {
    fallbackData: initial,
    refreshInterval: 4000,
    revalidateOnFocus: true,
  });

  function optimistic(patch: Partial<Issue>, action: () => Promise<{ ok: boolean; error?: string }>) {
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
        { optimisticData: { ...issue, ...patch }, rollbackOnError: true, revalidate: true },
      );
    });
  }

  const setStatus = (s: IssueStatus) => optimistic({ status: s }, () => updateIssueStatus(issue.id, s));
  const setPriority = (p: IssuePriority) => optimistic({ priority: p }, () => updateIssuePriority(issue.id, p));
  const setTitle = (t: string) => optimistic({ title: t }, () => updateIssueTitle(issue.id, t));
  const setAssignee = (id: string | null) => {
    const t = teammates.find(u => u.id === id);
    optimistic({ assignee: t ? { id: t.id, name: t.name, avatarColor: t.avatarColor } : null }, () => assignIssue(issue.id, id));
  };

  return (
    <>
      <header className="flex h-11 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
        <Link href="/?view=active" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={14} /> Board
        </Link>
        <span className="font-mono text-xs text-muted-foreground">{issue.key}</span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-3xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-6">
            <TitleEditor value={issue.title} onCommit={setTitle} />
            <p className="text-[13px] text-muted-foreground">
              {issue.projectName} · opened <RelativeTime date={issue.createdAt} /> · updated <RelativeTime date={issue.updatedAt} />
            </p>
            <div className="border-t pt-6">
              <IssueTabs issueId={issue.id} currentUser={currentUser} />
            </div>
          </div>

          <aside className="space-y-4 text-[13px] md:border-l md:pl-6">
            <Prop label="Status">
              <span className="flex items-center gap-2">
                <StatusSelect value={issue.status} onSelect={setStatus} /> {STATUS_META[issue.status].label}
              </span>
            </Prop>
            <Prop label="Priority">
              <PrioritySelect value={issue.priority} onSelect={setPriority} />
            </Prop>
            <Prop label="Assignee">
              <span className="flex items-center gap-2">
                <AssigneeSelect value={issue.assignee} teammates={teammates} onSelect={setAssignee} />
                {issue.assignee?.name ?? <span className="text-muted-foreground">Unassigned</span>}
              </span>
            </Prop>
            {issue.labels.length > 0 ? (
              <Prop label="Labels">
                <div className="flex flex-wrap gap-1">
                  {issue.labels.map(l => (
                    <span key={l.name} className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      <span className={cn('h-1.5 w-1.5 rounded-full', LABEL_DOT[l.color] ?? 'bg-neutral-400')} />
                      {l.name}
                    </span>
                  ))}
                </div>
              </Prop>
            ) : null}
          </aside>
        </div>
      </div>
    </>
  );
}

function TitleEditor({ value, onCommit }: { value: string; onCommit: (t: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <textarea
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => {
        const next = draft.trim();
        if (next && next !== value) onCommit(next);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      rows={2}
      className="w-full resize-none rounded-md bg-transparent text-xl font-semibold tracking-tight outline-none focus:bg-accent/40"
    />
  );
}

function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1 text-[11px] tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
