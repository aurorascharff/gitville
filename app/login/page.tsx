import { Layers } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SignInForm } from '@/features/user/components/sign-in-form';
import { SESSION_COOKIE } from '@/features/user/user-constants';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <RedirectIfAuthed />
      </Suspense>
      <div className="w-full max-w-xs">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background">
            <Layers size={18} strokeWidth={1.8} />
          </span>
          <div>
            <h1 className="font-mono text-base font-semibold">next16-deploy-platform</h1>
            <p className="mt-1 text-xs text-muted-foreground">No account needed — just pick a name.</p>
          </div>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}

async function RedirectIfAuthed() {
  const store = await cookies();
  if (store.has(SESSION_COOKIE)) redirect('/');
  return null;
}
