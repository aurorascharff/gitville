import type { User as UserRow } from '@/generated/prisma/client';

export type User = {
  id: string;
  name: string;
  initials: string;
  avatarClasses: string;
};

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    initials: initialsFor(row.name),
    avatarClasses: 'bg-gradient-to-br from-neutral-400 to-neutral-700 text-white',
  };
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
