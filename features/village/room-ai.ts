import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';

export const WALLS = ['cream', 'sage', 'sky', 'stone'] as const;
export const FLOORS = ['wood', 'stone', 'carpet'] as const;
export const ITEM_KINDS = ['plant', 'desk', 'bookshelf', 'lamp', 'crate', 'sofa', 'coffee table', 'monitor rig'] as const;

// The letters an AI-drawn sprite may use — must match AI_ART_PALETTE in pixel-sprite.tsx.
export const ART_LETTERS = 'OWwmsbrygpcot';

export type RoomItem = {
  name: string;
  kind?: (typeof ITEM_KINDS)[number];
  // One drawn piece per commit in the group; side by side they form the machine.
  pieces?: string[][];
  commits: number[]; // indexes into the room's commit list — grouped work becomes one build
};

// The AI is the carpenter, not the decorator: it builds furniture from the
// commits. The room's own walls and floors stay deterministic.
export type RoomSpec = {
  theme: string;
  items: RoomItem[];
};

// Structured-output providers reject regex, min/max, AND optional fields
// (every property must be required — use null instead). Sanitized below.
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

// The AI is the interior designer AND carpenter: it groups related commits into
// builds, sizes them by the work, and may draw original pixel art for each.
// Only successes are cached — a failure (missing key, model error) throws out
// of the cached scope so the next visit retries instead of serving null for days.
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
    // Never break a room over decoration, but never fail silently either.
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
      model: gateway('openai/gpt-5-nano'),
      schema: specSchema,
      prompt: [
        'You are a mad inventor furnishing one room in a pixel-art village where GitHub work is life. You build original contraptions that physically embody the feature being built. Think workshop machines, a time machine, a loom, a printing press, a telescope. Never settle for a plain crate or bookshelf when the work deserves an invention.',
        `The room belongs to "${label}"${sub ? ` (${sub})` : ''} in the ${slug} repository.`,
        state ? `The house is ${state}.` : '',
        'Commits in this room, in order (0-indexed):',
        ...commits.slice(0, 14).map((c, i) => `${i}. ${c}`),
        notes.length > 0 ? 'Discussion in this room:' : '',
        ...notes.slice(0, 6).map(n => `- ${n}`),
        '',
        'Rules:',
        '- Group commits that belong to the same piece of work into ONE item (its `commits` lists their indexes). Every index 0..N must appear in exactly one item.',
        '- Draw each item as `pieces`: EXACTLY one pixel-art block per commit in the group, designed to connect side by side (left end, middle segments, right end) into one machine. One commit means one self-contained piece.',
        '- Each piece is 3-12 rows of 2-16 characters, letters from the legend, "." = transparent. Align piece heights so they join cleanly.',
        '- Build BIG. Pieces should be 10-16 wide and 8-12 rows so the finished machine furnishes the room. No trinkets.',
        '- Every machine must have its own silhouette. Vary shapes with "." aggressively: towers, funnels, wheels, arms, chimneys, tanks. Vary the dominant color per machine. Never a plain filled rectangle.',
        '- Legend: O=dark outline, W=wood, w=dark wood, m=metal, s=screen green, b=blue, r=red, y=yellow, g=green, p=purple, c=cream, o=orange, t=teal.',
        `- Only fall back to a catalog \`kind\` [${ITEM_KINDS.join(', ')}] when you truly cannot invent anything. Set \`kind\` and \`pieces\` to null when unused.`,
        '- Theme name max 3 words. No emoji.',
      ]
        .filter(Boolean)
        .join('\n'),
  });

  return sanitizeSpec(specSchema.parse(object));
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
      const kind = ITEM_KINDS[hash(commits[idx[0]].id) % ITEM_KINDS.length];
      return { name: kind, kind, commits: idx };
    }),
  };
}
