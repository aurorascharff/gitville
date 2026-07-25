import type { User as UserRow } from '@/generated/prisma/client';

export type User = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
};

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    initials: initialsFor(row.name),
    avatarColor: row.avatarColor,
    role: row.role,
  };
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Tailwind classes per avatar color — used for teammate/assignee avatars.
export const AVATAR_CLASSES: Record<string, string> = {
  violet: 'bg-violet-500/20 text-violet-300',
  cyan: 'bg-cyan-500/20 text-cyan-300',
  amber: 'bg-amber-500/20 text-amber-300',
  emerald: 'bg-emerald-500/20 text-emerald-300',
  rose: 'bg-rose-500/20 text-rose-300',
  blue: 'bg-blue-500/20 text-blue-300',
};

export function avatarClass(color: string): string {
  return AVATAR_CLASSES[color] ?? AVATAR_CLASSES.violet;
}
