import { Suspense } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { AuthGate } from '@/components/auth-gate';

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Suspense>
        <AuthGate />
      </Suspense>
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
