import type { Project as ProjectRow } from '@/generated/prisma/client';

export type ProjectStatus = 'production' | 'building' | 'paused' | 'failed';

export type ProjectIconName = 'compass' | 'feather' | 'flame' | 'orbit' | 'prism' | 'waves' | 'mesh' | 'aurora';

export type ProjectLanguage = 'TypeScript' | 'JavaScript' | 'Rust' | 'Go' | 'Python';

export type Project = {
  id: string;
  name: string;
  description: string;
  framework: string;
  language: ProjectLanguage;
  status: ProjectStatus;
  icon: ProjectIconName;
  productionUrl: string;
  repo: string;
};

export function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    framework: row.framework,
    language: row.language as ProjectLanguage,
    status: row.status as ProjectStatus,
    icon: row.icon as ProjectIconName,
    productionUrl: row.productionUrl,
    repo: row.repo,
  };
}
