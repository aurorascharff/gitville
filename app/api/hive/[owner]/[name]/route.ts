import { getHivePayload, getRepoData } from '@/lib/github';

// The polling target. `getHivePayload` is cached remotely (~45s), so every client
// polling this route shares one upstream GitHub fetch per window.
export async function GET(_request: Request, { params }: RouteContext<'/api/hive/[owner]/[name]'>) {
  const { owner, name } = await params;
  const slug = `${owner}/${name}`;
  const repo = await getRepoData(slug);
  if (!repo) {
    return Response.json({
      ok: false,
      fetchedAt: new Date().toISOString(),
      defaultBranch: 'main',
      prs: [],
      branches: [],
      events: [],
    });
  }
  return Response.json(await getHivePayload(repo.slug, repo.defaultBranch));
}
