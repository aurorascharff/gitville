import { Analytics } from '@vercel/analytics/next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Pixelify_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/toaster';
import type { Metadata } from 'next';
import './globals.css';

const pixel = Pixelify_Sans({ subsets: ['latin'], variable: '--font-pixel' });

const description =
  'A tiny pixel village for every GitHub repo. Watch real contributors build, review, and chat, then scrub back in time.';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://gitville.vercel.app',
  ),
  description,
  title: {
    default: 'Gitville',
    template: '%s | Gitville',
  },
  openGraph: {
    type: 'website',
    siteName: 'Gitville',
    title: 'Gitville',
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gitville',
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${pixel.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen text-sm antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
