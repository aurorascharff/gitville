import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SignInForm } from '@/features/user/components/sign-in-form';
import { getCurrentUserId } from '@/features/user/user-queries';
import { LoopMark } from '@/components/loop-mark';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <RedirectIfAuthed />
      </Suspense>
      <div className="w-full max-w-xs">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <LoopMark size={40} />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Loop</h1>
            <p className="mt-1 text-xs text-muted-foreground">Where the team tracks what ships.</p>
          </div>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}

async function RedirectIfAuthed() {
  const userId = await getCurrentUserId();
  if (userId) redirect('/');
  return null;
}
