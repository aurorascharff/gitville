'use client';

import { useRef, useTransition } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { addComment, deleteComment } from '@/features/comment/comment-actions';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RelativeTime } from '@/components/ui/relative-time';
import { cn } from '@/lib/utils';
import { commentsKey, type Comment } from '@/types/comment';

const fetcher = (url: string): Promise<Comment[]> => fetch(url).then(r => r.json());

type CurrentUser = { id: string; name: string; avatarColor: string };

export function CommentThread({ issueId, currentUser }: { issueId: string; currentUser: CurrentUser }) {
  const key = commentsKey(issueId);
  const { data: comments = [], mutate } = useSWR<Comment[]>(key, fetcher, {
    refreshInterval: 4000,
    revalidateOnFocus: true,
    fallbackData: [],
  });
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function submit(formData: FormData) {
    const body = String(formData.get('body') ?? '').trim();
    if (!body) return;
    formRef.current?.reset();
    const optimistic: Comment = {
      id: `temp-${crypto.randomUUID()}`,
      issueId,
      userId: currentUser.id,
      authorName: currentUser.name,
      authorColor: currentUser.avatarColor,
      body,
      createdAt: new Date().toISOString(),
    };
    startTransition(async () => {
      await mutate(
        async () => {
          const res = await addComment(issueId, body);
          if (!res.ok) {
            toast.error(res.error);
            throw new Error(res.error);
          }
          return fetcher(key);
        },
        { optimisticData: [...comments, optimistic], rollbackOnError: true, revalidate: true },
      );
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await mutate(
        async () => {
          await deleteComment(id);
          return fetcher(key);
        },
        { optimisticData: comments.filter(c => c.id !== id), rollbackOnError: true, revalidate: true },
      );
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Comments{comments.length > 0 ? ` · ${comments.length}` : ''}
      </h3>

      <ul className="space-y-3">
        {comments.length === 0 ? (
          <li className="text-[13px] text-muted-foreground">No comments yet. Start the thread.</li>
        ) : (
          comments.map(c => (
            <li key={c.id} className="group flex items-start gap-2.5">
              <Avatar name={c.authorName} color={c.authorColor} size={22} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[13px]">
                  <span className="font-medium">{c.authorName}</span>
                  <span className="text-[11px] text-muted-foreground">
                    <RelativeTime date={c.createdAt} />
                  </span>
                </p>
                <p className="mt-0.5 text-[13px] break-words whitespace-pre-wrap">{c.body}</p>
              </div>
              {c.userId === currentUser.id && !c.id.startsWith('temp-') ? (
                <button
                  onClick={() => remove(c.id)}
                  className="shrink-0 text-[11px] text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                >
                  Delete
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>

      <form ref={formRef} action={submit} className="flex items-end gap-2">
        <textarea
          name="body"
          rows={1}
          placeholder="Leave a comment…"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement).requestSubmit();
            }
          }}
          className={cn(
            'min-h-8 w-full resize-none rounded-md border bg-transparent px-2.5 py-1.5 text-[13px]',
            'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none',
          )}
        />
        <Button type="submit" size="sm">
          Post
        </Button>
      </form>
    </div>
  );
}
