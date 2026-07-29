import 'server-only';

import { getRepoData } from '@/features/repo/repo-queries';
import { aiRoomsEnabled, fallbackSpec, generateRoomSpec } from '@/features/village/utils/room-ai';
import { buildCells, roomFor, type Cell } from '@/features/village/utils/village-model';
import {
  getBranchCommits,
  getIssueTitle,
  getPrCommits,
  getThreadNotes,
  getVillagePayload as getGitHubVillagePayload,
} from '@/lib/github';
import type { BranchCommit, RoomNote, RoomSpecPayload } from '@/types/github';

export async function getVillagePayload(slug: string, defaultBranch: string) {
  return getGitHubVillagePayload(slug, defaultBranch);
}

type RoomContext = {
  cell: Cell;
  title: string | null;
  commits: BranchCommit[];
  notes: RoomNote[];
  theme: string;
};

export async function getRoomSpecPayload(slug: string, cellId: string): Promise<RoomSpecPayload | null> {
  const context = await getRoomContext(slug, cellId);
  if (!context) return null;
  return roomPayload(context, fallbackSpec(context.theme, context.commits.map(c => ({ id: c.sha, actor: c.author }))), false);
}

export async function getAiRoomSpecPayload(slug: string, cellId: string): Promise<RoomSpecPayload | null> {
  const context = await getRoomContext(slug, cellId);
  if (!context) return null;
  const noteLines = context.notes.slice(-6).map(n => `${n.author}: ${n.body.slice(0, 120)}`);
  const ai =
    context.commits.length > 0 || noteLines.length > 0 || context.cell.sub
      ? await generateRoomSpec(
          slug,
          context.cell.label,
          context.cell.sub,
          context.commits.map(c => `${c.author}: ${c.message}${c.size > 0 ? ` (${c.size} lines changed)` : ''}`),
          noteLines,
          stateLine(context.cell),
        )
      : null;
  const spec = ai ?? fallbackSpec(context.theme, context.commits.map(c => ({ id: c.sha, actor: c.author })));
  return roomPayload(context, spec, Boolean(ai));
}

async function getRoomContext(slug: string, cellId: string): Promise<RoomContext | null> {
  const repo = await getRepoData(slug);
  if (!repo) return null;

  const payload = await getVillagePayload(repo.slug, repo.defaultBranch);
  const cells = buildCells(payload, repo.slug);
  const cell = cells.find(c => c.id === cellId);
  if (!cell) return null;

  const number = cell.kind === 'pr' || cell.kind === 'issue' ? Number(cell.id.split(':')[1]) : null;
  let commits: BranchCommit[] = [];
  let notes: RoomNote[] = [];
  let title: string | null = null;

  if (cell.kind === 'pr' && number != null) {
    [commits, notes, title] = await Promise.all([
      getPrCommits(repo.slug, number),
      getThreadNotes(repo.slug, number, true),
      getIssueTitle(repo.slug, number),
    ]);
  } else if (cell.kind === 'issue' && number != null) {
    [notes, title] = await Promise.all([getThreadNotes(repo.slug, number, false), getIssueTitle(repo.slug, number)]);
  } else if (cell.kind === 'branch' && cell.ref) {
    commits = await getBranchCommits(repo.slug, cell.ref);
  } else if (cell.kind === 'main') {
    commits = await getBranchCommits(repo.slug, payload.defaultBranch);
  }

  return { cell, title, commits: commits.slice(-14), notes, theme: roomFor(payload, cells, cellId).theme };
}

function stateLine(cell: Cell): string | null {
  if (cell.prState === 'stacked') return `a pull request stacked on top of #${cell.stackedOn}`;
  if (cell.prState === 'draft') return 'a draft pull request, still under construction';
  if (cell.prState === 'ready') return 'a pull request ready for review';
  return null;
}

function roomPayload(
  context: RoomContext,
  spec: Pick<RoomSpecPayload, 'theme' | 'items'>,
  ai: boolean,
): RoomSpecPayload {
  return {
    ok: true,
    cellId: context.cell.id,
    ...spec,
    title: context.title,
    commits: context.commits,
    notes: context.notes,
    ai,
    aiAvailable: aiRoomsEnabled(),
  };
}
