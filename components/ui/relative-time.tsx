'use client';

import { useEffect, useState } from 'react';
import { timeAgo } from '@/lib/utils';

// Client-only: Date.now can't run during prerender. Refreshes every 30s.
export function RelativeTime({ date }: { date: Date | string }) {
  const [text, setText] = useState('');

  useEffect(() => {
    const value = new Date(date);
    const update = () => setText(timeAgo(value));
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [date]);

  return <span suppressHydrationWarning>{text}</span>;
}
