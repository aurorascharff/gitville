import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';

export const WALLS = ['cream', 'sage', 'sky', 'stone'] as const;
export const FLOORS = ['wood', 'stone', 'carpet'] as const;
export const ITEM_KINDS = ['plant', 'desk', 'bookshelf', 'lamp', 'crate', 'sofa', 'coffee table', 'monitor rig'] as const;

// The letters an AI-drawn sprite may use — must match AI_ART_PALETTE in pixel-sprite.tsx.
export const ART_LETTERS = 'OWwmsbrygpc';

export type RoomItem = {
  name: string;
  kind?: (typeof ITEM_KINDS)[number];
  art?: string[];
  commits: number[]; // indexes into the room's commit list — grouped work becomes one build
};

export type RoomSpec = {
  theme: string;
  wall: (typeof WALLS)[number];
  floor: (typeof FLOORS)[number];
  items: RoomItem[];
};

const artRow = new RegExp(`^[${ART_LETTERS}.]{2,16}$`);

const specSchema = z.object({
  theme: z.string().max(28),
  wall: z.enum(WALLS),
  floor: z.enum(FLOORS),
  items: z
    .array(
      z.object({
        name: z.string().max(30),
        kind: z.enum(ITEM_KINDS).optional(),
        art: z.array(z.string().regex(artRow)).min(3).max(12).optional(),
        commits: z.array(z.number().int().min(0).max(13)).min(1).max(14),
      }),
    )
    .max(10),
});

function gatewayKey(): string | undefined {
  return process.env.VERCEL_AI_GATEWAY_KEY ?? process.env.AI_GATEWAY_API_KEY;
}

export function aiRoomsEnabled(): boolean {
  return Boolean(gatewayKey());
}

// The AI is the interior designer AND carpenter: it groups related commits into
// builds, sizes them by the work, and may draw original pixel art for each.
// Cached per room-state (args are the cache key) and shared by every visitor.
export async function generateRoomSpec(
  slug: string,
  label: string,
  sub: string | null,
  commits: string[],
  notes: string[] = [],
  state: string | null = null,
): Promise<RoomSpec | null> {
  'use cache: remote';
  cacheLife('days');
  cacheTag(`room-ai-${slug}`);

  if (!aiRoomsEnabled()) return null;

  try {
    const { generateObject } = await import('ai');
    const { createGateway } = await import('@ai-sdk/gateway');
    const gateway = createGateway({ apiKey: gatewayKey() });

    const { object } = await generateObject({
      model: gateway('openai/gpt-5-nano'),
      schema: specSchema,
      prompt: [
        'You furnish one room in a pixel-art village where GitHub work is life. The furniture must physically represent the feature being built.',
        `The room belongs to "${label}"${sub ? ` (${sub})` : ''} in the ${slug} repository.`,
        state ? `The house is ${state}.` : '',
        'Commits in this room, in order (0-indexed):',
        ...commits.slice(0, 14).map((c, i) => `${i}. ${c}`),
        notes.length > 0 ? 'Discussion in this room:' : '',
        ...notes.slice(0, 6).map(n => `- ${n}`),
        '',
        'Rules:',
        '- Group commits that belong to the same piece of work into ONE item (its `commits` lists their indexes). Every index 0..N must appear in exactly one item.',
        '- More/bigger commits in a group → that item should be drawn bigger. Small fix → small object.',
        '- Prefer drawing original pixel '.concat('`art`: 3-12 rows, 2-16 chars each, letters from the legend, "." = transparent. Make it look like what the work IS (a cache → an icebox, a parser → a loom, docs → a lectern).'),
        '- Legend: O=dark outline, W=wood, w=dark wood, m=metal, s=screen green, b=blue, r=red, y=yellow, g=green, p=purple, c=cream.',
        `- Only fall back to a catalog \`kind\` [${ITEM_KINDS.join(', ')}] when nothing better fits.`,
        `- Pick a wall from [${WALLS.join(', ')}] and floor from [${FLOORS.join(', ')}] that fit the work. Theme name max 3 words. No emoji.`,
      ]
        .filter(Boolean)
        .join('\n'),
    });

    return specSchema.parse(object);
  } catch {
    return null;
  }
}

// The no-token designer: same vocabulary, deterministic picks. Consecutive
// pushes by the same person read as one piece of work, so they group into one
// build — the feature is identical without AI, only the taste differs.
export function fallbackSpec(theme: string, commits: { id: string; actor?: string }[]): RoomSpec {
  const hash = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  const seed = hash(theme);

  const groups: number[][] = [];
  commits.slice(0, 14).forEach((c, i) => {
    const prev = groups[groups.length - 1];
    const prevActor = prev ? commits[prev[0]].actor : undefined;
    if (prev && c.actor && c.actor === prevActor && prev.length < 4) prev.push(i);
    else groups.push([i]);
  });

  return {
    theme,
    wall: WALLS[seed % WALLS.length],
    floor: FLOORS[seed % FLOORS.length],
    items: groups.map(idx => {
      const kind = ITEM_KINDS[hash(commits[idx[0]].id) % ITEM_KINDS.length];
      return { name: kind, kind, commits: idx };
    }),
  };
}
