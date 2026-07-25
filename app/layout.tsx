import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/toaster';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  description: 'A mini Vercel-style deployments dashboard — real sandbox deploys, live build logs, SWR.',
  title: {
    default: 'Deploy Platform',
    template: '%s · Deploy Platform',
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
