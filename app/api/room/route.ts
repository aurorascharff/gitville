import { aiRoomsEnabled, fallbackSpec, generateRoomSpec } from '@/features/village/room-ai';
import { buildCells, roomFor } from '@/features/village/village-model';
import { getBranchCommits, getPrCommits, getRepoData, getThreadNotes, getVillagePayload } from '@/lib/github';
import type { BranchCommit, RoomNote } from '@/types/github';

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

  const number = cell.kind === 'pr' || cell.kind === 'issue' ? Number(cell.id.split(':')[1]) : null;
  let commits: BranchCommit[] = [];
  let notes: RoomNote[] = [];
  if (cell.kind === 'pr' && number != null) {
    [commits, notes] = await Promise.all([getPrCommits(repo.slug, number), getThreadNotes(repo.slug, number, true)]);
  } else if (cell.kind === 'issue' && number != null) {
    notes = await getThreadNotes(repo.slug, number, false);
  } else if (cell.kind === 'branch' && cell.ref) {
    commits = await getBranchCommits(repo.slug, cell.ref);
  } else if (cell.kind === 'main') {
    commits = await getBranchCommits(repo.slug, payload.defaultBranch);
  }
  commits = commits.slice(-14);

  const room = roomFor(payload, cells, cellId);
  const noteLines = notes.slice(-6).map(n => `${n.author}: ${n.body.slice(0, 120)}`);

  const state =
    cell.prState === 'stacked'
      ? `a pull request stacked on top of #${cell.stackedOn}`
      : cell.prState === 'draft'
        ? 'a draft pull request, still under construction'
        : cell.prState === 'ready'
          ? 'a pull request ready for review'
          : null;

  // AI design only runs when the visitor asks for it (?ai=1) — the default
  // room is always the free deterministic one.
  const wantAi = url.searchParams.get('ai') === '1';
  const ai =
    wantAi && (commits.length > 0 || noteLines.length > 0 || cell.sub)
      ? await generateRoomSpec(
          repo.slug,
          cell.label,
          cell.sub,
          commits.map(c => `${c.author}: ${c.message}${c.size > 0 ? ` (${c.size} lines changed)` : ''}`),
          noteLines,
          state,
        )
      : null;
  const spec = ai ?? fallbackSpec(room.theme, commits.map(c => ({ id: c.sha, actor: c.author })));

  return Response.json({ ok: true, ...spec, commits, notes, ai: Boolean(ai), aiAvailable: aiRoomsEnabled() });
}
