import { Suspense } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { AuthGate } from '@/components/auth-gate';
import { SiteHeader } from '@/components/site-header';

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Suspense>
        <AuthGate />
      </Suspense>
      <SiteHeader />
      <div className="grid min-h-0 flex-1 sm:grid-cols-[200px_minmax(0,1fr)] md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
        <AppSidebar />
        <main className="min-w-0 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
