import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';
import { ROOM_SPEC_VERSION } from '@/features/village/village-cache';
import { hashString } from '@/lib/utils';

const ITEM_KINDS = ['plant', 'desk', 'bookshelf', 'lamp', 'crate', 'sofa', 'coffee table', 'monitor rig'] as const;
const ITEM_FORMS = [
  'workbench',
  'rack',
  'cabinet',
  'seating',
  'table',
  'lamp',
  'planter',
  'cart',
  'loom',
  'forge',
  'telescope',
  'display',
  'chest',
  'divider',
] as const;

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
  theme: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        form: z.enum(ITEM_FORMS),
        kind: z.enum(ITEM_KINDS).nullable().optional(),
        pixels: z.array(z.string()).min(3),
        size: z.number().int().min(1).max(4).nullable().optional(),
        commits: z.array(z.number()),
      }),
    )
    .min(1)
    .max(7),
});

const artRow = new RegExp(`^[${ART_LETTERS}.]{2,16}$`);

function firstJsonValue(text: string): string {
  const stack: string[] = [];
  let start = -1;
  let quoted = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (start < 0) {
      if (character !== '{' && character !== '[') continue;
      start = index;
      stack.push(character);
      continue;
    }
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quoted && character === '\\') {
      escaped = true;
      continue;
    }
    if (character === '"') {
      quoted = !quoted;
      continue;
    }
    if (quoted) continue;
    if (character === '{' || character === '[') stack.push(character);
    if (character === '}' || character === ']') {
      stack.pop();
      if (stack.length === 0) return text.slice(start, index + 1);
    }
  }

  throw new Error('AI response did not contain a complete JSON value.');
}

function normalizeGeneratedJson(text: string): string {
  const envelope: unknown = JSON.parse(firstJsonValue(text));
  if (!envelope || typeof envelope !== 'object' || !('items' in envelope)) return JSON.stringify(envelope);
  const items = envelope.items;
  return JSON.stringify({ ...envelope, items: typeof items === 'string' ? JSON.parse(firstJsonValue(items)) : items });
}

function artHasEnoughDetail(pixels: string[], index: number): boolean {
  const width = Math.max(...pixels.map(row => row.length));
  const height = pixels.length;
  const cells = pixels.join('').split('');
  const filled = cells.filter(cell => cell !== '.');
  const materials = new Set(filled.filter(cell => cell !== 'O'));
  const occupancy = filled.length / (width * height);
  const transparentRows = pixels.filter(row => row.includes('.')).length;
  const minWidth = index === 0 ? 12 : 9;
  const minHeight = index === 0 ? 9 : 7;

  return !(
    width < minWidth ||
    height < minHeight ||
    filled.length < 28 ||
    materials.size < 2 ||
    occupancy < 0.24 ||
    occupancy > 0.86 ||
    transparentRows < Math.ceil(height / 4)
  );
}

function sanitizeSpec(raw: z.infer<typeof specSchema>, commitCount: number, fallbackTheme: string): RoomSpec {
  const expected = Math.min(14, commitCount);
  const claimed = new Set<number>();
  const forms = new Set<(typeof ITEM_FORMS)[number]>();
  const items: RoomItem[] = raw.items.flatMap((item, itemIndex) => {
    const pixels = item.pixels.filter(row => artRow.test(row)).slice(0, 12);
    if (pixels.length < 3) return [];
    if (forms.has(item.form) || !artHasEnoughDetail(pixels, itemIndex)) return [];
    forms.add(item.form);

    const commits = item.commits.filter(index => {
      if (!Number.isInteger(index) || index < 0 || index >= expected || claimed.has(index)) return false;
      claimed.add(index);
      return true;
    });
    return [
      {
        name: item.name.slice(0, 30),
        kind: item.kind ?? undefined,
        pieces: [pixels],
        size: item.size ?? Math.min(4, Math.max(1, commits.length)),
        commits,
      },
    ];
  });
  if (items.length === 0) throw new Error('AI room has no drawable items.');

  for (let index = 0; index < expected; index += 1) {
    if (!claimed.has(index)) items[index % items.length].commits.push(index);
  }

  return {
    theme: (raw.theme ?? fallbackTheme).slice(0, 28),
    items: items.filter(item => item.commits.length > 0),
  };
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
  } catch (error) {
    // Keep provider and output-validation failures visible in server logs.
    // eslint-disable-next-line no-console
    console.warn('AI room generation failed.', error);
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

  const { extractJsonMiddleware, generateText, Output, wrapLanguageModel } = await import('ai');
  const { createGateway } = await import('@ai-sdk/gateway');
  const gateway = createGateway({ apiKey: gatewayKey() });
  const model = wrapLanguageModel({
    model: gateway('anthropic/claude-sonnet-5'),
    middleware: extractJsonMiddleware({ transform: normalizeGeneratedJson }),
  });

  const prompt = [
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
    '- Every object should feel at home in that room, but make each grouped piece of work inspire a DIFFERENT invention — one a machine, one a piece of furniture, one an odd little prop — so the room is a cabinet of curiosities, not a matching set.',
    '',
    'Map commits to objects:',
    '- Create 4-7 objects total. Group related commits into the same object so a busy room gets fewer, larger, more detailed objects instead of one small object per commit.',
    '- ALWAYS draw the art yourself in `pixels`. Every item must include one flat array of pixel rows, for example: `"pixels": ["..OO..", ".OggO.", "..OO.."]`. Return JSON data only; never put code or expressions inside a row.',
    '- Choose a unique `form` for every item. `form` is its recognizable furnishing silhouette, not its commit metaphor. Never repeat a form in one room.',
    '- Each item is ONE invented object standing for one coherent piece of work; name it so the tie to its commits is clear, and make it a clearly DIFFERENT thing from every other object in the room.',
    '- Every commit index 0..N must appear in exactly one item. Each item may cover several related commits.',
    '- Draw exactly one `pixels` block for the whole object, even when it represents several commits. Do NOT make one attached segment per commit.',
    '- Set `size` from 1 to 4. Use bigger sizes for grouped commits or larger changes, and make those objects grander or fancier with stronger silhouettes and richer details.',
    '',
    'Make the room read well:',
    '- Start from something that could actually furnish a room, then adapt that silhouette into the commit metaphor. It may become an abstract machine, but it must still read first as its chosen furnishing form.',
    '- Use these silhouette recipes: workbench = broad top + drawers/tools + separated legs; rack = tall posts + 3 open shelves; cabinet = tall doors/drawers + feet; seating = back + arms/cushion + feet; table = thin top + large open space + separated legs; lamp = shade + narrow stem/arm + base; planter = asymmetric leaves + neck + pot; cart = handle + open platform/bin + 2 wheels; loom = tall frame + large open threaded centre + feet; forge = chimney/hood + hearth/anvil + legs; telescope = long angled tube + tripod; display = asymmetric stand/case + pedestal; chest = lid + box + latch + feet; divider = tall multi-panel screen + feet.',
    '- Use thin silhouettes, cutouts, handles, legs, wheels, shelves, cloth folds, levers, funnels, cables, and asymmetry so each item looks like a particular thing, not a generic console.',
    '- Do not draw circles, rings, badges, pods, kettles, bells, drums, stamps, or rounded blobs. Do not use a compact dark outline wrapped around one coloured rectangle. Open negative space must describe the object.',
    '- The FIRST item is the centrepiece: the biggest, most detailed object embodying the headline change, sat in the middle of the room. The rest are smaller objects around it.',
    '- Give every object its OWN silhouette AND its OWN dominant colour so no two read alike. Vary shapes with "." aggressively (towers, legs, drawers, screens, funnels, arms, pots, lids) so the room is a collection of clearly-different things. Spread colour across the room (blue, green, red, purple, teal, orange, yellow) — never paint everything the same green-and-gold.',
    '- Cohesion comes from a shared ROOM, not a shared paint job: the same pixel style, the same dark outline (O), and common wood (W) / metal (m) framing tie the varied objects together.',
    '- Each `pixels` array is 7-12 rows and 9-16 columns, letters from the legend, "." = transparent. The centrepiece is 12-16 wide and 9-12 rows. Use the whole canvas for a strong silhouette and interior detail, while leaving deliberate transparent cutouts around legs, shelves, arms, or handles.',
    '- Use O plus at least three material/colour letters in every object. Keep 24-76% of the canvas occupied so it is neither a sparse symbol nor a solid block.',
    '- Legend: O=dark outline, W=wood, w=dark wood, m=metal, s=screen green, b=blue, r=red, y=yellow, g=green, p=purple, c=cream, o=orange, t=teal.',
    `- The catalog kinds [${ITEM_KINDS.join(', ')}] exist only as a last resort; set \`kind\` to null when unused, and draw your own \`pixels\` every time.`,
  ]
    .filter(Boolean)
    .join('\n');

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { output } = await generateText({
        model,
        output: Output.object({
          schema: specSchema,
          name: 'gitville_room',
          description: 'A themed room with 4-7 custom pixel-art objects covering every commit.',
        }),
        prompt,
      });
      return sanitizeSpec(specSchema.parse(output), commits.length, label);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
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
