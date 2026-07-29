import { revalidateTag } from 'next/cache';
import { getRepoData } from '@/features/repo/repo-queries';
import { getVillagePayload } from '@/features/village/village-queries';
import { villagePayloadTag } from '@/lib/github';

export async function GET(request: Request, { params }: RouteContext<'/api/village/[owner]/[name]'>) {
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
  if (new URL(request.url).searchParams.get('refresh') === '1') {
    revalidateTag(villagePayloadTag(repo.slug), { expire: 0 });
    revalidateTag(`gv-live-${repo.slug}`, { expire: 0 });
  }
  return Response.json(await getVillagePayload(repo.slug, repo.defaultBranch));
}
