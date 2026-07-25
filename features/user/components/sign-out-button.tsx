'use client';

import { LogOut } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { signOut } from '@/features/user/user-actions';

export function SignOutButton() {
  return (
    <form action={signOut}>
      <SignOutInner />
    </form>
  );
}

function SignOutInner() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Sign out"
      title="Sign out"
      className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
    >
      <LogOut className="size-3.5" />
    </button>
  );
}
