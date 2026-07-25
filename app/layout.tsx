import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/toaster';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  description:
    'A mini Vercel-style deployments dashboard with real sandbox deploys and live build logs streamed via SWR, built on Next.js 16.3 Cache Components.',
  title: {
    default: 'next16-deploy-platform',
    template: '%s · next16-deploy-platform',
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
