import { generateRoomSpec } from '@/features/village/room-ai';
import { buildCells, roomFor } from '@/features/village/village-model';
import { getVillagePayload, getRepoData } from '@/lib/github';

// Lazy room detail: fetched when a room opens. AI-themed when a gateway key is set
// (cached for days per room-state), deterministic otherwise.
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') ?? '';
  const cellId = url.searchParams.get('cell') ?? '';
  if (!slug.includes('/') || !cellId) return Response.json({ ok: false }, { status: 400 });

  const repo = await getRepoData(slug);
  if (!repo) return Response.json({ ok: false }, { status: 404 });

  const payload = await getVillagePayload(repo.slug, repo.defaultBranch);
  const cells = buildCells(payload, repo.slug);
  const cell = cells.find(c => c.id === cellId);
  if (!cell) return Response.json({ ok: false }, { status: 404 });

  const room = roomFor(payload, cells, cellId);
  const commitLines = room.commits.map(c => c.detail ?? c.line);
  const noteLines = room.notes.map(n => `${n.actor}: ${(n.body ?? '').slice(0, 120)}`);
  const spec =
    commitLines.length > 0 || noteLines.length > 0 || cell.sub
      ? await generateRoomSpec(repo.slug, cell.label, cell.sub, commitLines, noteLines)
      : null;

  return Response.json({
    ok: true,
    theme: spec?.theme ?? room.theme,
    flavor: spec?.flavor ?? null,
    items: spec?.items ?? [],
  });
}
