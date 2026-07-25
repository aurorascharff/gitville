'use client';

import { useEffect } from 'react';
import { useSWRConfig } from 'swr';
import { markNotificationsRead } from '@/features/activity/activity-actions';
import { NOTIFICATIONS_KEY } from '@/types/event';

export function MarkReadOnView() {
  const { mutate } = useSWRConfig();
  useEffect(() => {
    void markNotificationsRead().then(() => mutate(NOTIFICATIONS_KEY));
  }, [mutate]);
  return null;
}
