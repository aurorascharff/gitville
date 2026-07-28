'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useEffect } from 'react';

export const THEME_PINNED_KEY = 'gitville-theme-pinned';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <ClockTheme />
      {children}
    </NextThemesProvider>
  );
}

function ClockTheme() {
  const { setTheme } = useTheme();
  useEffect(() => {
    if (localStorage.getItem(THEME_PINNED_KEY)) return;
    const hour = new Date().getHours();
    setTheme(hour >= 7 && hour < 19 ? 'light' : 'dark');
  }, [setTheme]);
  return null;
}
