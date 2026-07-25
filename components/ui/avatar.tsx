import { cn } from '@/lib/utils';
import { avatarClass, initialsFor } from '@/types/user';

export function Avatar({ name, color, size = 20, className }: { name: string; color: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      title={name}
      style={{ height: size, width: size, fontSize: Math.round(size * 0.42) }}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', avatarClass(color), className)}
    >
      {initialsFor(name)}
    </span>
  );
}

export function EmptyAvatar({ size = 20 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ height: size, width: size }}
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground"
    />
  );
}
