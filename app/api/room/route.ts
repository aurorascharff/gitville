import { fallbackSpec, generateRoomSpec } from '@/features/village/room-ai';
import { buildCells, roomFor } from '@/features/village/village-model';
import { getBranchCommits, getPrCommits, getRepoData, getVillagePayload } from '@/lib/github';
import type { BranchCommit } from '@/types/github';

// Room detail, fetched when a door opens: the cell's real commits (push events
// no longer carry them) plus an AI-designed spec — deterministic without a key.
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

  let commits: BranchCommit[] = [];
  if (cell.kind === 'pr') commits = await getPrCommits(repo.slug, Number(cell.id.split(':')[1]));
  else if (cell.kind === 'branch' && cell.ref) commits = await getBranchCommits(repo.slug, cell.ref);
  else if (cell.kind === 'main') commits = await getBranchCommits(repo.slug, payload.defaultBranch);
  commits = commits.slice(-14);

  const room = roomFor(payload, cells, cellId);
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
    commits.length > 0 || noteLines.length > 0 || cell.sub
      ? await generateRoomSpec(
          repo.slug,
          cell.label,
          cell.sub,
          commits.map(c => `${c.author}: ${c.message}`),
          noteLines,
          state,
        )
      : null;
  const spec = ai ?? fallbackSpec(room.theme, commits.map(c => ({ id: c.sha, actor: c.author })));

  return Response.json({ ok: true, ...spec, commits });
}
