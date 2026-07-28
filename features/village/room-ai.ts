import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';
import { hashString } from '@/lib/utils';

export const ITEM_KINDS = [
  'plant',
  'desk',
  'bookshelf',
  'lamp',
  'crate',
  'sofa',
  'coffee table',
  'monitor rig',
] as const;

export const ART_LETTERS = 'OWwmsbrygpcot';

export type RoomItem = {
  name: string;
  kind?: (typeof ITEM_KINDS)[number];
  pieces?: string[][];
  commits: number[];
};

export type RoomSpec = {
  theme: string;
  items: RoomItem[];
};

// Structured-output providers reject regex, min/max, and optional fields: all required, use null.
const specSchema = z.object({
  theme: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      kind: z.enum(ITEM_KINDS).nullable(),
      pieces: z.array(z.array(z.string())).nullable(),
      commits: z.array(z.number()),
    }),
  ),
});

const artRow = new RegExp(`^[${ART_LETTERS}.]{2,16}$`);

function sanitizeSpec(raw: z.infer<typeof specSchema>): RoomSpec {
  const items: RoomItem[] = raw.items.slice(0, 10).map(item => {
    const pieces = (item.pieces ?? [])
      .map(piece => piece.filter(row => artRow.test(row)).slice(0, 12))
      .filter(piece => piece.length >= 3)
      .slice(0, 14);
    return {
      name: item.name.slice(0, 30),
      kind: item.kind ?? undefined,
      pieces: pieces.length > 0 ? pieces : undefined,
      commits: item.commits.filter(i => Number.isInteger(i) && i >= 0 && i <= 13),
    };
  });
  return { theme: raw.theme.slice(0, 28), items: items.filter(i => i.commits.length > 0) };
}

function gatewayKey(): string | undefined {
  return process.env.VERCEL_AI_GATEWAY_KEY ?? process.env.AI_GATEWAY_API_KEY;
}

export function aiRoomsEnabled(): boolean {
  return Boolean(gatewayKey());
}

export async function generateRoomSpec(
  slug: string,
  label: string,
  sub: string | null,
  commits: string[],
  notes: string[] = [],
  state: string | null = null,
): Promise<RoomSpec | null> {
  if (!aiRoomsEnabled()) return null;
  try {
    return await generateRoomSpecCached(slug, label, sub, commits, notes, state);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[room-ai] generation failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function generateRoomSpecCached(
  slug: string,
  label: string,
  sub: string | null,
  commits: string[],
  notes: string[],
  state: string | null,
): Promise<RoomSpec> {
  'use cache: remote';
  cacheLife('days');
  cacheTag(`room-ai-${slug}`);

  const { generateObject } = await import('ai');
  const { createGateway } = await import('@ai-sdk/gateway');
  const gateway = createGateway({ apiKey: gatewayKey() });

  const { object } = await generateObject({
    model: gateway('anthropic/claude-sonnet-5'),
    schema: specSchema,
    prompt: [
      'You are the set designer for one room in a pixel-art village where GitHub work comes alive. Your job is to compose a SINGLE COHESIVE SCENE — a themed workshop with a distinct personality — not a pile of unrelated props. Every object shares one world and clearly belongs beside the others.',
      `The room belongs to "${label}"${sub ? ` (${sub})` : ''} in the ${slug} repository.`,
      state ? `The house is ${state}.` : '',
      'Commits in this room, in order (0-indexed):',
      ...commits.slice(0, 14).map((c, i) => `${i}. ${c}`),
      notes.length > 0 ? 'Discussion in this room:' : '',
      ...notes.slice(0, 6).map(n => `- ${n}`),
      '',
      'Design the scene:',
      '- Read what this room actually builds and invent a workshop with a POINT OF VIEW: what is this place, what does it make, what is its mood? The `theme` names it (max 3 words, no emoji).',
      '- Pick ONE shared visual language for the whole room: a dominant palette of 2-3 legend colors plus one accent, and a recurring structural motif (e.g. brass pipes, riveted panels, glowing screens, woven cables). EVERY item must use this palette and motif so the room reads as one set.',
      '- The FIRST item is the HERO: the biggest, most detailed centerpiece contraption that embodies the feature. Every item after it is a supporting machine or prop that visibly RELATES to the hero — feeding it, reading from it, powered by it — and repeats the shared motif. Nothing floats on its own.',
      '',
      'Draw the items:',
      '- Group commits that belong to the same piece of work into ONE item (its `commits` lists their indexes). Every index 0..N must appear in exactly one item.',
      '- Draw each item as `pieces`: EXACTLY one pixel-art block per commit in the group, designed to connect side by side (left end, middle segments, right end) into one machine. One commit means one self-contained piece.',
      '- Each piece is 3-12 rows of 2-16 characters, letters from the legend, "." = transparent. Align piece heights so they join cleanly.',
      '- Build BIG. The hero should be 12-16 wide and 10-12 rows; supporting pieces 8-14 wide. No trinkets.',
      '- Give every machine its own silhouette — vary shapes with "." aggressively: towers, funnels, wheels, arms, chimneys, tanks, antennae. But keep the shared palette + motif so variety never breaks the cohesion.',
      '- Add connective detail at the edges of pieces (a protruding pipe, a cable stub, a rail) hinting that items link together into the workshop.',
      '- Legend: O=dark outline, W=wood, w=dark wood, m=metal, s=screen green, b=blue, r=red, y=yellow, g=green, p=purple, c=cream, o=orange, t=teal.',
      `- Only fall back to a catalog \`kind\` [${ITEM_KINDS.join(', ')}] when you truly cannot invent anything. Set \`kind\` and \`pieces\` to null when unused.`,
    ]
      .filter(Boolean)
      .join('\n'),
  });

  return sanitizeSpec(specSchema.parse(object));
}

export function fallbackSpec(theme: string, commits: { id: string; actor?: string }[]): RoomSpec {
  const groups: number[][] = [];
  commits.slice(0, 14).forEach((c, i) => {
    const prev = groups[groups.length - 1];
    const prevActor = prev ? commits[prev[0]].actor : undefined;
    if (prev && c.actor && c.actor === prevActor && prev.length < 4) prev.push(i);
    else groups.push([i]);
  });

  return {
    theme,
    items: groups.map(idx => {
      const kind = ITEM_KINDS[hashString(commits[idx[0]].id) % ITEM_KINDS.length];
      return { name: kind, kind, commits: idx };
    }),
  };
}
