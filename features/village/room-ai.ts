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

// Bump when the prompt changes: 'use cache' keys on the arguments, not the
// prompt text, so this version is threaded through as an argument to force a
// cache miss (regenerate every room) whenever the design brief is revised.
const PROMPT_VERSION = 'v3';

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
    return await generateRoomSpecCached(slug, label, sub, commits, notes, state, PROMPT_VERSION);
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
  version: string,
): Promise<RoomSpec> {
  'use cache: remote';
  cacheLife('days');
  cacheTag(`room-ai-${slug}`, `room-ai-${version}`);

  const { generateObject } = await import('ai');
  const { createGateway } = await import('@ai-sdk/gateway');
  const gateway = createGateway({ apiKey: gatewayKey() });

  const { object } = await generateObject({
    model: gateway('anthropic/claude-sonnet-5'),
    schema: specSchema,
    prompt: [
      'You are the set decorator for ONE room in a pixel-art village where a real GitHub project comes to life. Furnish the room so it feels like a lived-in room full of FURNITURE and objects that belong INDOORS — but themed so each object playfully stands for a real commit. This is a room (a themed study, workshop, library, or workroom), NOT a factory floor: no free-floating machines, funnels, or chimneys drifting in space.',
      `The room belongs to "${label}"${sub ? ` (${sub})` : ''} in the ${slug} repository.`,
      state ? `It is ${state}.` : '',
      'Commits in this room, in order (0-indexed):',
      ...commits.slice(0, 14).map((c, i) => `${i}. ${c}`),
      notes.length > 0 ? 'Discussion in this room:' : '',
      ...notes.slice(0, 6).map(n => `- ${n}`),
      '',
      'Decide the room:',
      '- Read what this work actually does and give the room a character: what kind of workroom is this, what is made here, what is its mood? `theme` names it (max 3 words, no emoji).',
      '- Furnish it only with things that would believably sit in such a room — desks, shelves, cabinets, workbenches, lamps, rugs, chests, a model or contraption resting ON a table. Every item must read as a piece of FURNITURE or a room object, never an abstract blob floating mid-air.',
      '',
      'Map commits to furniture:',
      '- Each item is ONE piece of furniture that stands for ONE piece of work; a viewer should look at it and loosely associate it with its commit. Name it so the tie to the commit is clear.',
      '- Group commits that clearly belong to the same piece of work into one item (its `commits` lists their indexes). Every index 0..N must appear in exactly one item. A lone commit is one self-contained piece of furniture.',
      '- Draw each item as `pieces`: EXACTLY one pixel-art block per commit in the group. When an item has several commits they combine into ONE bigger piece of furniture built from connected segments (sections of a long shelf, a desk plus the rig on it, stacked drawers), designed to join side by side (left end, middle, right end). Keep the segments individually legible — do NOT melt them into one shapeless mass.',
      '',
      'Make the room read well:',
      '- The FIRST item is the centrepiece: the biggest, most detailed object embodying the headline change, sat in the middle of the room. The rest are smaller supporting furniture around it.',
      '- Give every object its OWN silhouette AND its OWN dominant colour so no two read alike. Vary shapes with "." aggressively (legs, drawers, shelves, screens, cushions, pots, lids). Spread colour across the room (blue, green, red, purple, teal, orange, yellow) — never paint everything the same green-and-gold.',
      '- Cohesion comes from a shared ROOM, not a shared paint job: the same pixel style, the same dark outline (O), and common wood (W) / metal (m) framing tie the varied furniture together.',
      '- Each piece is 3-12 rows of 2-16 characters, letters from the legend, "." = transparent. Align piece heights within an item so segments join cleanly. Build at a comfortable size (centrepiece ~12-16 wide and 10-12 rows, supporting pieces ~8-14 wide) — no tiny trinkets.',
      '- Legend: O=dark outline, W=wood, w=dark wood, m=metal, s=screen green, b=blue, r=red, y=yellow, g=green, p=purple, c=cream, o=orange, t=teal.',
      `- Only fall back to a catalog \`kind\` [${ITEM_KINDS.join(', ')}] when you truly cannot invent a fitting object. Set \`kind\` and \`pieces\` to null when unused.`,
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
