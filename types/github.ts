export type RepoLanguage = { name: string; percent: number };

export type RepoData = {
  slug: string;
  owner: string;
  name: string;
  description: string;
  languages: RepoLanguage[];
  stars: number;
  openIssues: number;
  defaultBranch: string;
  homepage: string | null;
  ownerAvatar: string;
};

export type VillagePR = {
  number: number;
  title: string;
  url: string;
  author: string;
  authorAvatar: string | null;
  branch: string;
  baseRef: string;
  draft: boolean;
  mergeable: 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN' | null;
  mergeStateStatus: string | null;
  updatedAt: string;
};

export type WireEventKind =
  | 'push'
  | 'pr_opened'
  | 'pr_merged'
  | 'pr_closed'
  | 'review'
  | 'comment'
  | 'issue'
  | 'release'
  | 'branch_created'
  | 'branch_deleted';

export type WireEvent = {
  id: string;
  kind: WireEventKind;
  actor: string;
  avatar: string | null;
  line: string;
  isPr: boolean;
  detail: string | null;
  body: string | null;
  count: number | null;
  url: string | null;
  number: number | null;
  ref: string | null;
  at: string;
};

export type ActiveBranch = { ref: string; actor: string; at: string };

export type BranchCommit = { sha: string; message: string; author: string; at: string; url: string; size: number };

export type RoomNote = {
  id: string;
  author: string;
  avatar: string | null;
  body: string;
  at: string;
  url: string | null;
};

export type VillagePayload = {
  ok: boolean;
  fetchedAt: string;
  defaultBranch: string;
  prs: VillagePR[];
  branches: ActiveBranch[];
  events: WireEvent[];
};

export const villageKey = (slug: string) => `/api/village/${slug}`;
