'use client';

import { useEffect, useState } from 'react';
import { timeAgo } from '@/lib/utils';

// Renders relative time on the client only (Date.now can't run during prerender) and
// refreshes every 30s so "just now" → "1m" ages on its own.
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
