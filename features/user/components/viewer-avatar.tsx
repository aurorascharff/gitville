import { getCurrentUser } from '@/features/user/user-queries';
import { cn } from '@/lib/utils';
import { SignOutButton } from './sign-out-button';

export async function ViewerAvatar() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <span
        aria-label={user.name}
        title={user.name}
        className={cn('inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold', user.avatarClasses)}
      >
        {user.initials}
      </span>
      <SignOutButton />
    </div>
  );
}
