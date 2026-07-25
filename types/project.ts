import type { Project as ProjectRow } from '@/generated/prisma/client';

export type Project = {
  id: string;
  name: string;
  key: string;
  color: string;
  icon: string;
  description: string;
};

export function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    key: row.key,
    color: row.color,
    icon: row.icon,
    description: row.description,
  };
}

// Accent classes per project color.
export const PROJECT_DOT: Record<string, string> = {
  violet: 'bg-violet-400',
  cyan: 'bg-cyan-400',
  amber: 'bg-amber-400',
  emerald: 'bg-emerald-400',
  rose: 'bg-rose-400',
  blue: 'bg-blue-400',
};

export function projectDot(color: string): string {
  return PROJECT_DOT[color] ?? PROJECT_DOT.violet;
}
