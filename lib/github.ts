import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import type {
  ActiveBranch,
  BranchCommit,
  RoomNote,
  VillagePR,
  VillagePayload,
  VersionChannel,
  RepoData,
  WireEvent,
  WireEventKind,
} from '@/types/github';

const API = 'https://api.github.com';

const REPO_PART = /^[\w.-]+$/;
const UNKNOWN_ACTOR = 'someone';
const VILLAGE_PAYLOAD_TAG_PREFIX = 'gv-live-v2';

class GitHubUnavailableError extends Error {}

function repoParts(slug: string): { slug: string; owner: string; name: string; path: string } | null {
  const parsed = parseRepoSlug(slug);
  if (!parsed) return null;
  return {
    ...parsed,
    path: `/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.name)}`,
  };
}

function splitSlug(slug: string): [owner: string, repo: string] {
  const parsed = repoParts(slug);
  return parsed ? [parsed.owner, parsed.name] : ['', ''];
}

function repoPath(slug: string): string | null {
  return repoParts(slug)?.path ?? null;
}

export function villagePayloadTag(slug: string): string {
  return `${VILLAGE_PAYLOAD_TAG_PREFIX}-${slug}`;
}

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'gitville',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function gh<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { headers: ghHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function ghResult<T>(path: string, authenticated = true): Promise<{ data: T | null; status: number | null }> {
  try {
    const headers = ghHeaders();
    if (!authenticated) delete headers.Authorization;
    const res = await fetch(`${API}${path}`, { headers });
    if (!res.ok) return { data: null, status: res.status };
    return { data: (await res.json()) as T, status: res.status };
  } catch {
    return { data: null, status: null };
  }
}

export function parseRepoSlug(input: string): { slug: string; owner: string; name: string } | null {
  const clean = input.trim();
  const m =
    clean.match(/github\.com[/:]([^/\s]+)\/([^/\s#?]+?)(?:\.git)?(?:[#?].*)?$/i) ??
    clean.match(/^([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (!m) return null;
  const owner = m[1];
  const name = m[2];
  if (!validRepoPart(owner, 39) || !validRepoPart(name, 100)) return null;
  return { slug: `${owner}/${name}`, owner, name };
}

function validRepoPart(part: string, max: number) {
  return part.length > 0 && part.length <= max && part !== '.' && part !== '..' && REPO_PART.test(part);
}

type RepoResponse = {
  name: string;
  description: string | null;
  stargazers_count: number;
  open_issues_count: number;
  default_branch: string;
  homepage: string | null;
  private?: boolean;
  owner: { avatar_url: string };
};

export async function getRepoData(slug: string): Promise<RepoData | null> {
  'use cache: remote';
  cacheLife('hours');
  cacheTag(`gh-repo-${slug}`);
  const parsed = repoParts(slug);
  if (!parsed) return null;
  const result = await ghResult<RepoResponse>(parsed.path);
  if (!result.data) {
    if (result.status === 404) return null;
    const fallback = await getGraphqlRepoData(parsed);
    if (fallback) return fallback;
    const publicResult = process.env.GITHUB_TOKEN
      ? await ghResult<RepoResponse>(parsed.path, false)
      : { data: null, status: result.status };
    if (!publicResult.data) throw new GitHubUnavailableError('GitHub repository metadata is unavailable');
    return mapRepoData(parsed, publicResult.data, {});
  }
  if (result.data.private) return null;

  const langs = (await gh<Record<string, number>>(`${parsed.path}/languages`)) ?? {};
  return mapRepoData(parsed, result.data, langs);
}

function mapRepoData(
  parsed: NonNullable<ReturnType<typeof repoParts>>,
  meta: RepoResponse,
  langs: Record<string, number>,
): RepoData {
  const total = Object.values(langs).reduce((s, b) => s + Number(b), 0) || 1;
  const languages = Object.entries(langs)
    .map(([name, bytes]) => ({ name, percent: Math.round((Number(bytes) / total) * 100) }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);

  return {
    slug: parsed.slug,
    owner: parsed.owner,
    name: meta.name,
    description: meta.description ?? '',
    languages,
    stars: meta.stargazers_count ?? 0,
    openIssues: meta.open_issues_count ?? 0,
    defaultBranch: meta.default_branch ?? 'main',
    homepage: meta.homepage || null,
    ownerAvatar: meta.owner?.avatar_url ?? '',
  };
}

async function getGraphqlRepoData(parsed: NonNullable<ReturnType<typeof repoParts>>): Promise<RepoData | null> {
  const data = await ghGraphQL<{
    repository: {
      name: string;
      description: string | null;
      stargazerCount: number;
      issues: { totalCount: number };
      defaultBranchRef: { name: string } | null;
      homepageUrl: string | null;
      owner: { login: string; avatarUrl: string };
      languages: {
        totalSize: number;
        edges: { size: number; node: { name: string } }[] | null;
      };
    } | null;
  }>(
    `query($owner:String!,$repo:String!){ repository(owner:$owner,name:$repo){
      name description stargazerCount homepageUrl
      issues(states:OPEN){ totalCount }
      defaultBranchRef{ name }
      owner{ login avatarUrl }
      languages(first:5,orderBy:{field:SIZE,direction:DESC}){ totalSize edges{ size node{ name } } }
    } }`,
    { owner: parsed.owner, repo: parsed.name },
  );
  const repo = data?.repository;
  if (!repo) return null;
  const total = repo.languages.totalSize || 1;
  return {
    slug: parsed.slug,
    owner: repo.owner.login,
    name: repo.name,
    description: repo.description ?? '',
    languages: (repo.languages.edges ?? []).map(edge => ({
      name: edge.node.name,
      percent: Math.round((edge.size / total) * 100),
    })),
    stars: repo.stargazerCount,
    openIssues: repo.issues.totalCount,
    defaultBranch: repo.defaultBranchRef?.name ?? 'main',
    homepage: repo.homepageUrl,
    ownerAvatar: repo.owner.avatarUrl,
  };
}

type PullResponse = {
  number: number;
  title: string;
  html_url: string;
  draft: boolean;
  updated_at: string;
  user: { login: string; avatar_url: string } | null;
  head: { ref: string; sha: string };
  base: { ref: string };
  mergeable?: boolean | null;
  mergeable_state?: string | null;
  requested_reviewers?: { login: string; avatar_url: string }[];
  assignees?: { login: string; avatar_url: string }[];
  comments?: number;
  review_comments?: number;
};

type EventResponse = {
  id: string;
  type: string;
  actor: { login: string; avatar_url: string };
  created_at: string;
  payload: {
    ref?: string | null;
    ref_type?: string;
    size?: number;
    head?: string;
    before?: string;
    commits?: { message: string }[];
    action?: string;
    pull_request?: { number: number; title: string; html_url: string; merged?: boolean };
    issue?: { number: number; title: string; html_url: string; pull_request?: { html_url?: string } | null };
    release?: { tag_name: string; html_url: string };
    comment?: { html_url: string; body?: string | null };
    review?: { body?: string | null };
  };
};

function trimBody(body?: string | null): string | null {
  if (!body) return null;
  const clean = body.replace(/\r/g, '').trim();
  return clean.length > 600 ? `${clean.slice(0, 597)}…` : clean;
}

function shortRef(ref?: string | null): string {
  return (ref ?? '').replace(/^refs\/heads\//, '');
}

function mapEvent(e: EventResponse, slug: string): WireEvent | null {
  const base = {
    id: e.id,
    actor: e.actor?.login ?? UNKNOWN_ACTOR,
    avatar: e.actor?.login ? `https://avatars.githubusercontent.com/${e.actor.login}` : null,
    at: e.created_at,
    isPr: false,
    detail: null as string | null,
    body: null as string | null,
    count: null as number | null,
    url: null as string | null,
    number: null as number | null,
    ref: null as string | null,
  };
  const p = e.payload ?? {};

  switch (e.type) {
    case 'PushEvent': {
      const branch = shortRef(p.ref);
      const n = p.size ?? p.commits?.length ?? 0;
      const pushUrl =
        p.head && p.before && n > 1
          ? `https://github.com/${slug}/compare/${p.before.slice(0, 12)}...${p.head.slice(0, 12)}`
          : p.head
            ? `https://github.com/${slug}/commit/${p.head}`
            : null;
      return {
        ...base,
        kind: 'push',
        ref: branch || null,
        count: n,
        url: pushUrl,
        line: n > 0 ? `pushed ${n === 1 ? 'a commit' : `${n} commits`} to ${branch}` : `pushed to ${branch}`,
        detail: p.commits?.[0]?.message?.split('\n')[0] ?? null,
      };
    }
    case 'PullRequestEvent': {
      const pr = p.pull_request;
      if (!pr || !['opened', 'reopened', 'closed'].includes(p.action ?? '')) return null;
      const kind: WireEventKind = p.action === 'closed' ? (pr.merged ? 'pr_merged' : 'pr_closed') : 'pr_opened';
      const verb =
        kind === 'pr_merged'
          ? 'merged'
          : kind === 'pr_closed'
            ? 'closed'
            : p.action === 'reopened'
              ? 'reopened'
              : 'opened';
      return {
        ...base,
        kind,
        isPr: true,
        number: pr.number,
        line: `${verb} #${pr.number}`,
        detail: pr.title,
        url: pr.html_url,
      };
    }
    case 'PullRequestReviewEvent': {
      const pr = p.pull_request;
      if (!pr) return null;
      return {
        ...base,
        kind: 'review',
        isPr: true,
        body: trimBody(p.review?.body),
        number: pr.number,
        line: `reviewed #${pr.number}`,
        detail: pr.title,
        url: pr.html_url,
      };
    }
    case 'IssueCommentEvent': {
      const issue = p.issue;
      if (!issue || p.action !== 'created') return null;
      return {
        ...base,
        kind: 'comment',
        isPr: Boolean(issue.pull_request),
        body: trimBody(p.comment?.body),
        number: issue.number,
        line: `commented on #${issue.number}`,
        detail: issue.title,
        url: p.comment?.html_url ?? issue.pull_request?.html_url ?? issue.html_url,
      };
    }
    case 'IssuesEvent': {
      const issue = p.issue;
      if (!issue || !['opened', 'closed'].includes(p.action ?? '')) return null;
      return {
        ...base,
        kind: 'issue',
        number: issue.number,
        line: `${p.action} #${issue.number}`,
        detail: issue.title,
        url: issue.html_url,
      };
    }
    case 'ReleaseEvent': {
      const rel = p.release;
      if (!rel) return null;
      return { ...base, kind: 'release', line: `released ${rel.tag_name}`, url: rel.html_url };
    }
    case 'CreateEvent':
      if (p.ref_type !== 'branch' || !p.ref) return null;
      return { ...base, kind: 'branch_created', ref: p.ref, line: `created branch ${p.ref}` };
    case 'DeleteEvent':
      if (p.ref_type !== 'branch' || !p.ref) return null;
      return { ...base, kind: 'branch_deleted', ref: p.ref, line: `deleted branch ${p.ref}` };
    default:
      return null;
  }
}

type CommitResponse = {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name?: string; date?: string } | null };
  author: { login: string } | null;
};

function mapCommit(c: CommitResponse): BranchCommit {
  return {
    sha: c.sha,
    message: (c.commit?.message ?? '').split('\n')[0],
    author: c.author?.login ?? c.commit?.author?.name ?? UNKNOWN_ACTOR,
    at: c.commit?.author?.date ?? '',
    url: c.html_url,
    size: 0,
  };
}

type GqlCommit = {
  oid: string;
  messageHeadline: string;
  additions: number;
  deletions: number;
  committedDate: string;
  url: string;
  author: { user: { login: string } | null; name: string | null } | null;
};

function mapGqlCommit(c: GqlCommit): BranchCommit {
  return {
    sha: c.oid,
    message: c.messageHeadline,
    author: c.author?.user?.login ?? c.author?.name ?? UNKNOWN_ACTOR,
    at: c.committedDate,
    url: c.url,
    size: (c.additions ?? 0) + (c.deletions ?? 0),
  };
}

async function ghGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  if (!process.env.GITHUB_TOKEN) return null;
  try {
    const res = await fetch(`${API}/graphql`, {
      method: 'POST',
      headers: ghHeaders(),
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function getPrCommits(slug: string, number: number): Promise<BranchCommit[]> {
  'use cache: remote';
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  cacheTag(`gh-commits-${slug}`);
  const [owner, repo] = splitSlug(slug);
  const path = repoPath(slug);
  if (!path) return [];

  const data = await ghGraphQL<{
    repository: { pullRequest: { commits: { nodes: { commit: GqlCommit }[] } } | null } | null;
  }>(
    `query($owner:String!,$repo:String!,$number:Int!){ repository(owner:$owner,name:$repo){ pullRequest(number:$number){
       commits(last:14){ nodes{ commit{ oid messageHeadline additions deletions committedDate url author{ user{ login } name } } } } } } }`,
    { owner, repo, number },
  );
  const nodes = data?.repository?.pullRequest?.commits.nodes;
  if (nodes) return nodes.map(n => mapGqlCommit(n.commit));

  const list = await gh<CommitResponse[]>(`${path}/pulls/${number}/commits?per_page=14`);
  return (list ?? []).map(mapCommit);
}

export async function getBranchCommits(slug: string, ref: string): Promise<BranchCommit[]> {
  'use cache: remote';
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  cacheTag(`gh-commits-${slug}`);
  const [owner, repo] = splitSlug(slug);
  const path = repoPath(slug);
  if (!path) return [];

  const data = await ghGraphQL<{
    repository: { ref: { target: { history: { nodes: GqlCommit[] } } | null } | null } | null;
  }>(
    `query($owner:String!,$repo:String!,$ref:String!){ repository(owner:$owner,name:$repo){ ref(qualifiedName:$ref){
       target{ ... on Commit { history(first:14){ nodes{ oid messageHeadline additions deletions committedDate url author{ user{ login } name } } } } } } } }`,
    { owner, repo, ref: `refs/heads/${ref}` },
  );
  const nodes =
    data?.repository?.ref?.target && 'history' in data.repository.ref.target
      ? data.repository.ref.target.history.nodes
      : null;
  if (nodes) return nodes.map(mapGqlCommit).reverse();

  const list = await gh<CommitResponse[]>(`${path}/commits?sha=${encodeURIComponent(ref)}&per_page=14`);
  return (list ?? []).map(mapCommit).reverse();
}

type CommentResponse = {
  id: number;
  body?: string | null;
  html_url?: string | null;
  submitted_at?: string;
  created_at?: string;
  user: { login: string; avatar_url: string } | null;
};

export async function getThreadNotes(slug: string, number: number, isPr: boolean): Promise<RoomNote[]> {
  'use cache: remote';
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  cacheTag(`gh-notes-${slug}`);
  const path = repoPath(slug);
  if (!path) return [];
  const [comments, reviews] = await Promise.all([
    gh<CommentResponse[]>(`${path}/issues/${number}/comments?per_page=30`),
    isPr ? gh<CommentResponse[]>(`${path}/pulls/${number}/reviews?per_page=30`) : Promise.resolve(null),
  ]);
  return [...(comments ?? []), ...(reviews ?? [])]
    .filter(c => (c.body ?? '').trim().length > 0 && !(c.user?.login ?? '').endsWith('[bot]'))
    .map(c => ({
      id: String(c.id),
      author: c.user?.login ?? UNKNOWN_ACTOR,
      avatar: c.user?.avatar_url ?? null,
      body: trimBody(c.body) ?? '',
      at: c.created_at ?? c.submitted_at ?? '',
      url: c.html_url ?? null,
    }))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export async function getIssueTitle(slug: string, number: number): Promise<string | null> {
  'use cache: remote';
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  cacheTag(`gh-title-${slug}`);
  const path = repoPath(slug);
  if (!path) return null;
  const data = await gh<{ title: string | null }>(`${path}/issues/${number}`);
  return data?.title ?? null;
}

function deriveBranches(events: EventResponse[], defaultBranch: string): ActiveBranch[] {
  const seen = new Map<string, ActiveBranch>();
  for (const e of events) {
    if (e.type !== 'PushEvent') continue;
    const ref = shortRef(e.payload?.ref);
    if (!ref || ref === defaultBranch) continue;
    if (!seen.has(ref)) seen.set(ref, { ref, actor: e.actor?.login ?? UNKNOWN_ACTOR, at: e.created_at });
  }
  return [...seen.values()].slice(0, 8);
}

type GqlPull = {
  number: number;
  title: string;
  url: string;
  isDraft: boolean;
  updatedAt: string;
  headRefName: string;
  baseRefName: string;
  mergeable: VillagePR['mergeable'];
  mergeStateStatus: string | null;
  reviewDecision: VillagePR['reviewDecision'];
  comments: { totalCount: number } | null;
  reviews: { totalCount: number } | null;
  assignees: { nodes: ({ login: string; avatarUrl: string } | null)[] | null } | null;
  reviewRequests: {
    nodes:
      | ({
          requestedReviewer: { login: string; avatarUrl: string } | { name: string } | null;
        } | null)[]
      | null;
  } | null;
  commits: {
    nodes:
      | ({
          commit: {
            statusCheckRollup: { state: VillagePR['checkState'] } | null;
          };
        } | null)[]
      | null;
  } | null;
  author: { login: string; avatarUrl: string } | null;
};

type PullsResult = {
  prs: VillagePR[];
  total: number | null;
  checksComplete: boolean;
};

type CheckRunsResponse = {
  total_count: number;
  check_runs: {
    status: 'queued' | 'in_progress' | 'completed' | 'waiting' | 'requested' | 'pending';
    conclusion:
      'action_required' | 'cancelled' | 'failure' | 'neutral' | 'success' | 'skipped' | 'stale' | 'timed_out' | null;
  }[];
};

type CheckStateResult =
  { complete: true; state: VillagePR['checkState'] } | { complete: false; state: VillagePR['checkState'] };

type ReleaseResponse = {
  tag_name: string;
  name?: string | null;
  html_url?: string | null;
  prerelease?: boolean;
  draft?: boolean;
  published_at?: string | null;
  created_at?: string | null;
};

type TagResponse = {
  name: string;
  zipball_url?: string | null;
};

type GqlReviewRequest = NonNullable<NonNullable<GqlPull['reviewRequests']>['nodes']>[number];

function mapReviewRequest(node: GqlReviewRequest): { login: string; avatar: string | null } | null {
  const reviewer = node?.requestedReviewer;
  if (!reviewer) return null;
  if ('login' in reviewer) return { login: reviewer.login, avatar: reviewer.avatarUrl };
  return { login: reviewer.name, avatar: null };
}

function channelForVersion(name: string, prerelease = false): VersionChannel['channel'] {
  if (/(canary|nightly|experimental|dev)/i.test(name)) return 'canary';
  if (prerelease || /(preview|beta|alpha|rc|next)/i.test(name)) return 'preview';
  return 'stable';
}

function pickVersionChannels(items: VersionChannel[]): VersionChannel[] {
  const byChannel = new Map<VersionChannel['channel'], VersionChannel>();
  for (const item of items) {
    if (!byChannel.has(item.channel)) byChannel.set(item.channel, item);
  }
  return (['stable', 'preview', 'canary'] as const).flatMap(channel => {
    const item = byChannel.get(channel);
    return item ? [item] : [];
  });
}

async function getVersionChannels(slug: string): Promise<VersionChannel[]> {
  const path = repoPath(slug);
  if (!path) return [];
  const releases = await gh<ReleaseResponse[]>(`${path}/releases?per_page=30`);
  const releaseChannels = (releases ?? [])
    .filter(release => !release.draft)
    .map(release => {
      const name = release.name || release.tag_name;
      return {
        channel: channelForVersion(name, Boolean(release.prerelease)),
        name,
        url: release.html_url ?? null,
        at: release.published_at ?? release.created_at ?? null,
      };
    });

  if (releaseChannels.length > 0) return pickVersionChannels(releaseChannels);

  const tags = await gh<TagResponse[]>(`${path}/tags?per_page=30`);
  return pickVersionChannels(
    (tags ?? []).map(tag => ({
      channel: channelForVersion(tag.name),
      name: tag.name,
      url: tag.zipball_url ?? null,
      at: null,
    })),
  );
}

async function getOpenPulls(slug: string): Promise<PullsResult | null> {
  const [owner, repo] = splitSlug(slug);
  const path = repoPath(slug);
  if (!path) return null;
  const data = await ghGraphQL<{
    repository: { pullRequests: { totalCount: number; nodes: (GqlPull | null)[] | null } | null } | null;
  }>(
    `query($owner:String!,$repo:String!){ repository(owner:$owner,name:$repo){
      pullRequests(first:64,states:OPEN,orderBy:{field:UPDATED_AT,direction:DESC}){
        totalCount
        nodes{
          number title url isDraft updatedAt headRefName baseRefName mergeable mergeStateStatus reviewDecision
          comments{ totalCount }
          reviews{ totalCount }
          assignees(first:3){ nodes{ login avatarUrl } }
          reviewRequests(first:3){ nodes{ requestedReviewer{ ... on User { login avatarUrl } ... on Team { name } } } }
          commits(last:1){ nodes{ commit{ statusCheckRollup{ state } } } }
          author{ login avatarUrl }
        }
      } } }`,
    { owner, repo },
  );
  const pullRequests = data?.repository?.pullRequests;
  const nodes = pullRequests?.nodes;
  if (nodes) {
    const prs = nodes
      .filter((pr): pr is GqlPull => pr !== null)
      .map(pr => ({
        number: pr.number,
        title: pr.title,
        url: pr.url,
        author: pr.author?.login ?? UNKNOWN_ACTOR,
        authorAvatar: pr.author?.avatarUrl ?? null,
        branch: pr.headRefName,
        baseRef: pr.baseRefName,
        draft: pr.isDraft,
        mergeable: pr.mergeable,
        mergeStateStatus: pr.mergeStateStatus,
        checkState: pr.commits?.nodes?.[0]?.commit.statusCheckRollup?.state ?? null,
        reviewDecision: pr.reviewDecision,
        noteCount: (pr.comments?.totalCount ?? 0) + (pr.reviews?.totalCount ?? 0),
        reviewers: (pr.reviewRequests?.nodes ?? []).map(mapReviewRequest).filter(r => r !== null),
        assignees: (pr.assignees?.nodes ?? [])
          .filter(person => person !== null)
          .map(person => ({ login: person.login, avatar: person.avatarUrl })),
        updatedAt: pr.updatedAt,
      }));
    return { prs, total: pullRequests?.totalCount ?? prs.length, checksComplete: true };
  }

  const pulls = await gh<PullResponse[]>(`${path}/pulls?state=open&sort=updated&direction=desc&per_page=64`);
  if (!Array.isArray(pulls)) return null;

  const checkStates = await Promise.all(pulls.slice(0, 36).map(pr => getRestCheckState(slug, pr.head.sha)));
  const stateBySha = new Map(pulls.slice(0, 36).map((pr, i) => [pr.head.sha, checkStates[i]]));

  return {
    prs: pulls.map(pr => ({
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      author: pr.user?.login ?? UNKNOWN_ACTOR,
      authorAvatar: pr.user?.avatar_url ?? null,
      branch: pr.head?.ref ?? '',
      baseRef: pr.base?.ref ?? '',
      draft: Boolean(pr.draft),
      mergeable: pr.mergeable === true ? 'MERGEABLE' : pr.mergeable === false ? 'CONFLICTING' : 'UNKNOWN',
      mergeStateStatus: pr.mergeable_state ?? null,
      checkState: stateBySha.get(pr.head.sha)?.state ?? null,
      reviewDecision: null,
      noteCount: (pr.comments ?? 0) + (pr.review_comments ?? 0),
      reviewers: (pr.requested_reviewers ?? []).map(person => ({ login: person.login, avatar: person.avatar_url })),
      assignees: (pr.assignees ?? []).map(person => ({ login: person.login, avatar: person.avatar_url })),
      updatedAt: pr.updated_at,
    })),
    total: null,
    checksComplete: checkStates.every(result => result.complete),
  };
}

async function getRestCheckState(slug: string, sha: string): Promise<CheckStateResult> {
  const path = repoPath(slug);
  if (!path) return { complete: false, state: null };
  const runs = await gh<CheckRunsResponse>(`${path}/commits/${encodeURIComponent(sha)}/check-runs?per_page=100`);
  if (!runs) return { complete: false, state: null };
  if (runs.total_count === 0) return { complete: true, state: null };
  return { complete: true, state: mapCheckRunsState(runs.check_runs) };
}

function mapCheckRunsState(runs: CheckRunsResponse['check_runs']): VillagePR['checkState'] {
  if (runs.some(run => run.status !== 'completed')) return 'PENDING';
  if (
    runs.some(
      run => run.conclusion === 'action_required' || run.conclusion === 'failure' || run.conclusion === 'timed_out',
    )
  )
    return 'FAILURE';
  if (runs.some(run => run.conclusion === 'cancelled' || run.conclusion === 'stale')) return 'ERROR';
  if (runs.some(run => run.conclusion === null)) return 'PENDING';
  return 'SUCCESS';
}

function unavailableVillagePayload(
  defaultBranch: string,
  warnings: string[] = ['GitHub is rate limiting this village.'],
) {
  return {
    ok: false,
    partial: true,
    warnings,
    fetchedAt: new Date().toISOString(),
    defaultBranch,
    prs: [],
    branches: [],
    events: [],
    versions: [],
  } satisfies VillagePayload;
}

async function readVillagePayload(slug: string, defaultBranch: string): Promise<VillagePayload> {
  const path = repoPath(slug);
  if (!path) return unavailableVillagePayload(defaultBranch, ['That GitHub repo path is not supported.']);
  const [pulls, versions, ...eventPages] = await Promise.all([
    getOpenPulls(slug),
    getVersionChannels(slug),
    gh<EventResponse[]>(`${path}/events?per_page=100&page=1`),
    gh<EventResponse[]>(`${path}/events?per_page=100&page=2`),
    gh<EventResponse[]>(`${path}/events?per_page=100&page=3`),
  ]);
  const warnings: string[] = [];
  if (!pulls) warnings.push('pull requests are still loading');
  if (pulls && !pulls.checksComplete) warnings.push('pull request checks are still loading');
  const failedEventPages = eventPages.filter(page => !Array.isArray(page)).length;
  if (failedEventPages > 0) warnings.push('recent activity is still loading');
  const merged = eventPages.flatMap(page => (Array.isArray(page) ? page : []));
  const events = [...new Map(merged.map(e => [e.id, e])).values()];

  if (!pulls && events.length === 0) {
    return unavailableVillagePayload(defaultBranch);
  }

  const wire = (events ?? [])
    .map(e => mapEvent(e, slug))
    .filter((e): e is WireEvent => e !== null)
    .filter(e => !(e.actor.endsWith('[bot]') && (e.kind === 'comment' || e.kind === 'review')))
    .slice(0, 300);

  return {
    ok: true,
    partial: warnings.length > 0 || undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    fetchedAt: new Date().toISOString(),
    defaultBranch,
    prs: pulls?.prs ?? [],
    prTotal: pulls?.total ?? undefined,
    branches: deriveBranches(events ?? [], defaultBranch),
    events: wire,
    versions,
  };
}

async function getCachedVillagePayload(slug: string, defaultBranch: string): Promise<VillagePayload> {
  'use cache: remote';
  cacheTag(villagePayloadTag(slug));

  const payload = await readVillagePayload(slug, defaultBranch);
  cacheLife(
    payload.ok && !payload.partial
      ? { stale: 45, revalidate: 45, expire: 600 }
      : { stale: 15, revalidate: 60, expire: 120 },
  );
  return payload;
}

export async function getVillagePayload(slug: string, defaultBranch: string): Promise<VillagePayload> {
  try {
    return await getCachedVillagePayload(slug, defaultBranch);
  } catch {
    return unavailableVillagePayload(defaultBranch);
  }
}
