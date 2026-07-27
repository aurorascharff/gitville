'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <ClockTheme />
      {children}
    </NextThemesProvider>
  );
}

// Match the village to the visitor's local time: daylight is light, dusk on is dark.
function ClockTheme() {
  const { setTheme } = useTheme();
  useEffect(() => {
    const hour = new Date().getHours();
    setTheme(hour >= 7 && hour < 19 ? 'light' : 'dark');
  }, [setTheme]);
  return null;
}
