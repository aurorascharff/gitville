import { buildCells, roomFor } from '@/features/hive/hive-world-model';
import { generateRoomSpec } from '@/features/hive/room-ai';
import { getHivePayload, getRepoData } from '@/lib/github';

// Lazy room detail: fetched when a room opens. AI-themed when a gateway key is set
// (cached for days per room-state), deterministic otherwise.
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') ?? '';
  const cellId = url.searchParams.get('cell') ?? '';
  if (!slug.includes('/') || !cellId) return Response.json({ ok: false }, { status: 400 });

  const repo = await getRepoData(slug);
  if (!repo) return Response.json({ ok: false }, { status: 404 });

  const payload = await getHivePayload(repo.slug, repo.defaultBranch);
  const cells = buildCells(payload, repo.slug);
  const cell = cells.find(c => c.id === cellId);
  if (!cell) return Response.json({ ok: false }, { status: 404 });

  const room = roomFor(payload, cells, cellId);
  const commitLines = room.commits.map(c => c.detail ?? c.line);
  const spec = commitLines.length > 0 ? await generateRoomSpec(repo.slug, cell.label, cell.sub, commitLines) : null;

  return Response.json({
    ok: true,
    theme: spec?.theme ?? room.theme,
    flavor: spec?.flavor ?? null,
    items: spec?.items ?? [],
  });
}
