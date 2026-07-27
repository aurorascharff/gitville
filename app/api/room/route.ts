import { fallbackSpec, generateRoomSpec } from '@/features/village/room-ai';
import { buildCells, roomFor } from '@/features/village/village-model';
import { getVillagePayload, getRepoData } from '@/lib/github';

// Room detail, fetched when a door opens. AI-designed with a gateway key (cached for
// days per room-state), same design system deterministically without one.
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

  const state =
    cell.prState === 'stacked'
      ? `a pull request stacked on top of #${cell.stackedOn}`
      : cell.prState === 'draft'
        ? 'a draft pull request, still under construction'
        : cell.prState === 'ready'
          ? 'a pull request ready for review'
          : null;

  const ai =
    commitLines.length > 0 || noteLines.length > 0 || cell.sub
      ? await generateRoomSpec(repo.slug, cell.label, cell.sub, commitLines, noteLines, state)
      : null;
  const spec = ai ?? fallbackSpec(room.theme, room.commits.map(c => ({ id: c.id, line: c.detail ?? c.line })));

  return Response.json({ ok: true, ...spec });
}
