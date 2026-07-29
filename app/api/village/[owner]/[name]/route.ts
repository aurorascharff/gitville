import { getRepoData } from '@/features/repo/repo-queries';
import { getVillagePayload } from '@/features/village/village-queries';

export async function GET(_request: Request, { params }: RouteContext<'/api/village/[owner]/[name]'>) {
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
      versions: [],
    });
  }
  return Response.json(await getVillagePayload(repo.slug, repo.defaultBranch));
}
