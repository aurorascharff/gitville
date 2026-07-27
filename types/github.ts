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
  draft: boolean;
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
  line: string; // "pushed 2 commits to canary"
  detail: string | null; // e.g. first commit message / PR title
  body: string | null; // comment/review text — the sticky notes
  count: number | null; // commits in a push — furniture built
  url: string | null;
  // Machine-usable target so the world can place the actor at a cell.
  number: number | null; // PR/issue number
  ref: string | null; // branch name
  at: string;
};

export type ActiveBranch = { ref: string; actor: string; at: string };

export type VillagePayload = {
  ok: boolean;
  fetchedAt: string;
  defaultBranch: string;
  prs: VillagePR[];
  branches: ActiveBranch[];
  events: WireEvent[];
};

export const villageKey = (slug: string) => `/api/village/${slug}`;
