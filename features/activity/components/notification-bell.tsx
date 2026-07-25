'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import useSWR from 'swr';
import { NOTIFICATIONS_KEY, type NotificationsPayload } from '@/types/event';

const fetcher = (url: string): Promise<NotificationsPayload> => fetch(url).then(res => res.json());

// Live unseen-activity badge — polls every 5s. Client island so the app shell stays static.
export function NotificationBell() {
  const { data } = useSWR<NotificationsPayload>(NOTIFICATIONS_KEY, fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    fallbackData: { count: 0 },
  });
  const count = data?.count ?? 0;

  return (
    <Link
      href="/activity"
      aria-label={count > 0 ? `Activity, ${count} unseen` : 'Activity'}
      className="relative inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Bell size={15} strokeWidth={1.8} />
      {count > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-semibold text-brand-foreground">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </Link>
  );
}
