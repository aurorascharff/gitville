'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useEffect } from 'react';

// Set once the visitor picks Day or Night by hand, so their choice survives
// reloads instead of snapping back to the local clock.
export const THEME_PINNED_KEY = 'gitville-theme-pinned';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <ClockTheme />
      {children}
    </NextThemesProvider>
  );
}

// Match the village to the visitor's local time until they set it themselves:
// daylight is light, dusk on is dark.
function ClockTheme() {
  const { setTheme } = useTheme();
  useEffect(() => {
    if (localStorage.getItem(THEME_PINNED_KEY)) return;
    const hour = new Date().getHours();
    setTheme(hour >= 7 && hour < 19 ? 'light' : 'dark');
  }, [setTheme]);
  return null;
}
