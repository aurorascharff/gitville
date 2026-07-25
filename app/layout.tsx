import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/toaster';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  description:
    'Loop — a live issue tracker for teams. Your board stays in sync as teammates move work, with everything server-rendered first and kept live by SWR. Built on Next.js 16.3.',
  title: {
    default: 'Loop',
    template: '%s · Loop',
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen text-sm antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
