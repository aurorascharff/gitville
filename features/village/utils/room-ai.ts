import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';
import { ROOM_SPEC_VERSION } from '@/features/village/village-cache';
import { hashString } from '@/lib/utils';

const ITEM_KINDS = ['plant', 'desk', 'bookshelf', 'lamp', 'crate', 'sofa', 'coffee table', 'monitor rig'] as const;

const ART_LETTERS = 'OWwmsbrygpcot';
type RoomItem = {
  name: string;
  kind?: (typeof ITEM_KINDS)[number];
  pieces?: string[][];
  size?: number;
  commits: number[];
};

type RoomSpec = {
  theme: string;
  items: RoomItem[];
};

const specSchema = z.object({
  theme: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      kind: z.enum(ITEM_KINDS).nullable(),
      pieces: z.array(z.array(z.string())).min(1),
      size: z.number().int().min(1).max(4).nullable().optional(),
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
    if (pieces.length === 0) throw new Error('AI item is missing valid pixel art.');
    return {
      name: item.name.slice(0, 30),
      kind: item.kind ?? undefined,
      pieces: pieces.length > 0 ? [pieces[0]] : undefined,
      size: item.size ?? Math.min(4, Math.max(1, item.commits.length)),
      commits: item.commits.filter(i => Number.isInteger(i) && i >= 0 && i <= 13),
    };
  });
  const spec = { theme: raw.theme.slice(0, 28), items: items.filter(i => i.commits.length > 0) };
  if (spec.items.length === 0) throw new Error('AI room has no drawable items.');
  return spec;
}

function assertCompleteSpec(spec: RoomSpec, commitCount: number): void {
  const expected = Math.min(14, commitCount);
  if (expected === 0) return;
  const covered = new Set<number>();
  for (const item of spec.items) {
    for (const index of item.commits) {
      if (index >= 0 && index < expected) covered.add(index);
    }
  }
  if (covered.size < expected) throw new Error('AI room did not draw every commit.');
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
    return await generateRoomSpecCached(ROOM_SPEC_VERSION, slug, label, sub, commits, notes, state);
  } catch {
    return null;
  }
}

async function generateRoomSpecCached(
  version: number,
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
      'You are the set decorator for ONE room in a pixel-art village where a real GitHub project comes to life. Fill the room with a VARIED collection of objects you INVENT yourself — each one your own little pixel-art creation that playfully stands for a real commit and would believably sit in this room. Mix it up freely: furniture (desks, shelves, chests), props and curios, and gadgets or machines when the work calls for it. The one rule is variety and invention — never repeat the same kind of object, and never settle for a plain bookshelf-and-crate look.',
      `Pixel art contract v${version}: every accepted room must include drawn art for every item.`,
      `The room belongs to "${label}"${sub ? ` (${sub})` : ''} in the ${slug} repository.`,
      state ? `It is ${state}.` : '',
      'Commits in this room, in order (0-indexed):',
      ...commits.slice(0, 14).map((c, i) => `${i}. ${c}`),
      notes.length > 0 ? 'Discussion in this room:' : '',
      ...notes.slice(0, 6).map(n => `- ${n}`),
      '',
      'Decide the room:',
      '- Read what this work actually does and give the room a character: what is made here, what is its mood? `theme` names it (max 3 words, no emoji).',
      '- Every object should feel at home in that room, but let each commit inspire a DIFFERENT invention — one a machine, one a piece of furniture, one an odd little prop — so the room is a cabinet of curiosities, not a matching set.',
      '',
      'Map commits to objects:',
      '- ALWAYS draw the art yourself in `pieces`. Every item must include one valid `pieces` block; reaching for `kind` without art means giving up, so avoid it.',
      '- Each item is ONE invented object standing for ONE piece of work; name it so the tie to the commit is clear, and make it a clearly DIFFERENT thing from every other object in the room.',
      '- Group commits that clearly belong to the same piece of work into one item (its `commits` lists their indexes). Every index 0..N must appear in exactly one item. A lone commit is one self-contained object.',
      '- Draw each item as `pieces`: EXACTLY one pixel-art block for the whole object, even when it represents several commits. Do NOT make one attached segment per commit.',
      '- Set `size` from 1 to 4. Use bigger sizes for grouped commits or larger changes, and make those objects grander or fancier with stronger silhouettes and richer details.',
      '',
      'Make the room read well:',
      '- Make objects readable as a mix of furniture, tools, props, and abstract machines. Avoid plain rectangular screens/boxes unless the commit truly calls for one.',
      '- Use thin silhouettes, cutouts, handles, legs, wheels, shelves, cloth folds, levers, funnels, cables, and asymmetry so each item looks like a particular thing, not a generic console.',
      '- The FIRST item is the centrepiece: the biggest, most detailed object embodying the headline change, sat in the middle of the room. The rest are smaller objects around it.',
      '- Give every object its OWN silhouette AND its OWN dominant colour so no two read alike. Vary shapes with "." aggressively (towers, legs, drawers, screens, funnels, arms, pots, lids) so the room is a collection of clearly-different things. Spread colour across the room (blue, green, red, purple, teal, orange, yellow) — never paint everything the same green-and-gold.',
      '- Cohesion comes from a shared ROOM, not a shared paint job: the same pixel style, the same dark outline (O), and common wood (W) / metal (m) framing tie the varied objects together.',
      '- Each piece is 3-12 rows of 2-16 characters, letters from the legend, "." = transparent. Build at a comfortable size (centrepiece ~12-16 wide and 10-12 rows, supporting pieces ~8-14 wide) — no tiny trinkets.',
      '- Legend: O=dark outline, W=wood, w=dark wood, m=metal, s=screen green, b=blue, r=red, y=yellow, g=green, p=purple, c=cream, o=orange, t=teal.',
      `- The catalog kinds [${ITEM_KINDS.join(', ')}] exist only as a last resort; set \`kind\` to null when unused, and draw your own \`pieces\` every time.`,
    ]
      .filter(Boolean)
      .join('\n'),
  });

  const spec = sanitizeSpec(specSchema.parse(object));
  assertCompleteSpec(spec, commits.length);
  return spec;
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
      return { name: kind, kind, size: Math.min(4, idx.length), commits: idx };
    }),
  };
}
