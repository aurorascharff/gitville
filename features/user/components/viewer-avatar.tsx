import { getCurrentUser } from '@/features/user/user-queries';
import { Avatar } from '@/components/ui/avatar';
import { SignOutButton } from '@/features/user/components/sign-out-button';

export async function ViewerAvatar() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <Avatar name={user.name} color={user.avatarColor} size={24} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{user.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{user.role}</p>
      </div>
      <SignOutButton />
    </div>
  );
}
