import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import type { ActiveBranch, BranchCommit, RoomNote, VillagePR, VillagePayload, RepoData, WireEvent, WireEventKind } from '@/types/github';

const API = 'https://api.github.com';

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'gitville',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  // 5000 req/hr with a token vs 60 without — strongly recommended in production.
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

export function parseRepoSlug(input: string): { slug: string; owner: string; name: string } | null {
  const clean = input.trim();
  const m =
    clean.match(/github\.com[/:]([^/\s]+)\/([^/\s#?]+?)(?:\.git)?(?:[#?].*)?$/i) ??
    clean.match(/^([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (!m) return null;
  return { slug: `${m[1]}/${m[2]}`, owner: m[1], name: m[2] };
}

type RepoResponse = {
  name: string;
  description: string | null;
  stargazers_count: number;
  open_issues_count: number;
  default_branch: string;
  homepage: string | null;
  owner: { avatar_url: string };
};

// Repo identity changes slowly — cache for hours, shared across all users.
export async function getRepoData(slug: string): Promise<RepoData | null> {
  'use cache: remote';
  cacheLife('hours');
  cacheTag(`gh-repo-${slug}`);
  const [owner, repo] = slug.split('/');
  const meta = await gh<RepoResponse>(`/repos/${owner}/${repo}`);
  if (!meta) return null;

  const langs = (await gh<Record<string, number>>(`/repos/${owner}/${repo}/languages`)) ?? {};
  const total = Object.values(langs).reduce((s, b) => s + Number(b), 0) || 1;
  const languages = Object.entries(langs)
    .map(([name, bytes]) => ({ name, percent: Math.round((Number(bytes) / total) * 100) }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);

  return {
    slug,
    owner,
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

type PullResponse = {
  number: number;
  title: string;
  html_url: string;
  draft: boolean;
  updated_at: string;
  user: { login: string; avatar_url: string } | null;
  head: { ref: string };
  base: { ref: string };
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
    issue?: { number: number; title: string; html_url: string };
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
    actor: e.actor?.login ?? 'someone',
    avatar: e.actor?.login ? `https://avatars.githubusercontent.com/${e.actor.login}` : null,
    at: e.created_at,
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
      return { ...base, kind, number: pr.number, line: `${verb} #${pr.number}`, detail: pr.title, url: pr.html_url };
    }
    case 'PullRequestReviewEvent': {
      const pr = p.pull_request;
      if (!pr) return null;
      return {
        ...base,
        kind: 'review',
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
        body: trimBody(p.comment?.body),
        number: issue.number,
        line: `commented on #${issue.number}`,
        detail: issue.title,
        url: p.comment?.html_url ?? issue.html_url,
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
    author: c.author?.login ?? c.commit?.author?.name ?? 'someone',
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
    author: c.author?.user?.login ?? c.author?.name ?? 'someone',
    at: c.committedDate,
    url: c.url,
    size: (c.additions ?? 0) + (c.deletions ?? 0),
  };
}

// Diff sizes only exist on GraphQL (one call) — REST would cost a call per commit.
async function ghGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  if (!process.env.GITHUB_TOKEN) return null;
  try {
    const res = await fetch(`${API}/graphql`, { method: 'POST', headers: ghHeaders(), body: JSON.stringify({ query, variables }) });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T };
    return json.data ?? null;
  } catch {
    return null;
  }
}

// Push events no longer include commit lists, so rooms fetch the real thing:
// GraphQL with diff sizes when a token exists, plain REST without one.
export async function getPrCommits(slug: string, number: number): Promise<BranchCommit[]> {
  'use cache: remote';
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  cacheTag(`gh-commits-${slug}`);
  const [owner, repo] = slug.split('/');

  const data = await ghGraphQL<{ repository: { pullRequest: { commits: { nodes: { commit: GqlCommit }[] } } | null } | null }>(
    `query($owner:String!,$repo:String!,$number:Int!){ repository(owner:$owner,name:$repo){ pullRequest(number:$number){
       commits(last:14){ nodes{ commit{ oid messageHeadline additions deletions committedDate url author{ user{ login } name } } } } } } }`,
    { owner, repo, number },
  );
  const nodes = data?.repository?.pullRequest?.commits.nodes;
  if (nodes) return nodes.map(n => mapGqlCommit(n.commit));

  const list = await gh<CommitResponse[]>(`/repos/${owner}/${repo}/pulls/${number}/commits?per_page=14`);
  return (list ?? []).map(mapCommit);
}

export async function getBranchCommits(slug: string, ref: string): Promise<BranchCommit[]> {
  'use cache: remote';
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  cacheTag(`gh-commits-${slug}`);
  const [owner, repo] = slug.split('/');

  const data = await ghGraphQL<{ repository: { ref: { target: { history: { nodes: GqlCommit[] } } | null } | null } | null }>(
    `query($owner:String!,$repo:String!,$ref:String!){ repository(owner:$owner,name:$repo){ ref(qualifiedName:$ref){
       target{ ... on Commit { history(first:14){ nodes{ oid messageHeadline additions deletions committedDate url author{ user{ login } name } } } } } } } }`,
    { owner, repo, ref: `refs/heads/${ref}` },
  );
  const nodes = data?.repository?.ref?.target && 'history' in data.repository.ref.target ? data.repository.ref.target.history.nodes : null;
  // Newest first from both APIs; oldest first reads as construction order.
  if (nodes) return nodes.map(mapGqlCommit).reverse();

  const list = await gh<CommitResponse[]>(`/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(ref)}&per_page=14`);
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

// The real thread: conversation comments, plus review bodies for PRs. The
// events feed only covers a recent window, so rooms fetch the whole wall.
export async function getThreadNotes(slug: string, number: number, isPr: boolean): Promise<RoomNote[]> {
  'use cache: remote';
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  cacheTag(`gh-notes-${slug}`);
  const [owner, repo] = slug.split('/');
  const [comments, reviews] = await Promise.all([
    gh<CommentResponse[]>(`/repos/${owner}/${repo}/issues/${number}/comments?per_page=30`),
    isPr ? gh<CommentResponse[]>(`/repos/${owner}/${repo}/pulls/${number}/reviews?per_page=30`) : Promise.resolve(null),
  ]);
  return [...(comments ?? []), ...(reviews ?? [])]
    .filter(c => (c.body ?? '').trim().length > 0 && !(c.user?.login ?? '').endsWith('[bot]'))
    .map(c => ({
      id: String(c.id),
      author: c.user?.login ?? 'someone',
      avatar: c.user?.avatar_url ?? null,
      body: trimBody(c.body) ?? '',
      at: c.created_at ?? c.submitted_at ?? '',
      url: c.html_url ?? null,
    }))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

// Feature branches with recent pushes — derived from the event stream, no extra API calls.
function deriveBranches(events: EventResponse[], defaultBranch: string): ActiveBranch[] {
  const seen = new Map<string, ActiveBranch>();
  for (const e of events) {
    if (e.type !== 'PushEvent') continue;
    const ref = shortRef(e.payload?.ref);
    if (!ref || ref === defaultBranch) continue;
    if (!seen.has(ref)) seen.set(ref, { ref, actor: e.actor?.login ?? 'someone', at: e.created_at });
  }
  return [...seen.values()].slice(0, 8);
}

// The village snapshot: open PRs + the event window, in two GitHub calls. Cached remotely for
// ~45s so every polling client shares one upstream fetch per window (rate-limit safe).
export async function getVillagePayload(slug: string, defaultBranch: string): Promise<VillagePayload> {
  'use cache: remote';
  cacheLife({ stale: 45, revalidate: 45, expire: 600 });
  cacheTag(`gv-live-${slug}`);

  const [owner, repo] = slug.split('/');
  // GitHub's events API serves up to 300 events across 3 pages — fetch them all so the
  // time machine can scrub back days, not hours.
  const [pulls, ...eventPages] = await Promise.all([
    gh<PullResponse[]>(`/repos/${owner}/${repo}/pulls?state=open&sort=updated&direction=desc&per_page=12`),
    gh<EventResponse[]>(`/repos/${owner}/${repo}/events?per_page=100&page=1`),
    gh<EventResponse[]>(`/repos/${owner}/${repo}/events?per_page=100&page=2`),
    gh<EventResponse[]>(`/repos/${owner}/${repo}/events?per_page=100&page=3`),
  ]);
  const merged = eventPages.flatMap(page => (Array.isArray(page) ? page : []));
  // Event pages shift while we fetch — the same event can appear on two pages.
  const events = [...new Map(merged.map(e => [e.id, e])).values()];

  if (!Array.isArray(pulls) && events.length === 0) {
    return { ok: false, fetchedAt: new Date().toISOString(), defaultBranch, prs: [], branches: [], events: [] };
  }

  const prs: VillagePR[] = (pulls ?? []).map(pr => ({
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    author: pr.user?.login ?? 'someone',
    authorAvatar: pr.user?.avatar_url ?? null,
    branch: pr.head?.ref ?? '',
    baseRef: pr.base?.ref ?? '',
    draft: Boolean(pr.draft),
    updatedAt: pr.updated_at,
  }));

  const wire = (events ?? [])
    .map(e => mapEvent(e, slug))
    .filter((e): e is WireEvent => e !== null)
    // Bot comment chatter drowns out the humans on busy repos.
    .filter(e => !(e.actor.endsWith('[bot]') && (e.kind === 'comment' || e.kind === 'review')))
    .slice(0, 300);

  return {
    ok: true,
    fetchedAt: new Date().toISOString(),
    defaultBranch,
    prs,
    branches: deriveBranches(events ?? [], defaultBranch),
    events: wire,
  };
}
