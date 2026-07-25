'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { CommentThread } from '@/features/comment/components/comment-thread';
import { RelativeTime } from '@/components/ui/relative-time';
import { cn } from '@/lib/utils';
import { historyKey, type ActivityEvent } from '@/types/event';

type CurrentUser = { id: string; name: string; avatarColor: string };
const fetcher = (url: string): Promise<ActivityEvent[]> => fetch(url).then(r => r.json());

export function IssueTabs({ issueId, currentUser }: { issueId: string; currentUser: CurrentUser }) {
  const [tab, setTab] = useState<'comments' | 'history'>('comments');
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 text-xs">
        <Tab active={tab === 'comments'} onClick={() => setTab('comments')}>
          Comments
        </Tab>
        <Tab active={tab === 'history'} onClick={() => setTab('history')}>
          History
        </Tab>
      </div>
      {tab === 'comments' ? <CommentThread issueId={issueId} currentUser={currentUser} /> : <HistoryList issueId={issueId} />}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn('rounded-md px-2 py-1 font-medium transition-colors', active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground')}
    >
      {children}
    </button>
  );
}

function HistoryList({ issueId }: { issueId: string }) {
  const { data: events = [] } = useSWR<ActivityEvent[]>(historyKey(issueId), fetcher, {
    refreshInterval: 4000,
    revalidateOnFocus: true,
    fallbackData: [],
  });

  if (events.length === 0) return <p className="text-[13px] text-muted-foreground">No history yet.</p>;

  return (
    <ul className="space-y-2.5">
      {events.map(e => (
        <li key={e.id} className="flex items-start gap-2 text-[13px]">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
          <p className="min-w-0 flex-1">
            <span className="font-medium">{e.actorName}</span> <span className="text-muted-foreground">{e.message}</span>
            <span className="ml-1.5 text-[11px] text-muted-foreground">
              <RelativeTime date={e.createdAt} />
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}
