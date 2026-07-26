import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';

export type RoomSpec = {
  theme: string;
  flavor: string;
  items: string[]; // one playful name per commit, aligned by index
};

const specSchema = z.object({
  theme: z.string().max(28),
  flavor: z.string().max(90),
  items: z.array(z.string().max(36)).max(14),
});

function gatewayKey(): string | undefined {
  return process.env.VERCEL_AI_GATEWAY_KEY ?? process.env.AI_GATEWAY_API_KEY;
}

export function aiRoomsEnabled(): boolean {
  return Boolean(gatewayKey());
}

// One generation per room-state (the commit list is part of the cache key), shared by
// every visitor and kept for days — so the AI cost stays a trickle, not a stream.
export async function generateRoomSpec(
  slug: string,
  label: string,
  sub: string | null,
  commits: string[],
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
        'You are decorating one tiny room in a cozy pixel-art village where GitHub work is life.',
        `The room belongs to "${label}"${sub ? ` — ${sub}` : ''} in the ${slug} repository.`,
        'Recent commits built the furniture, one piece per commit, in order:',
        ...commits.slice(0, 14).map((c, i) => `${i + 1}. ${c}`),
        '',
        'Reply with: a playful room theme name (max 3 words, e.g. "Turbo Forge", "Flaky Test Attic"),',
        'one wry flavor line about what is being built here, and a short playful furniture name for',
        'each commit in order (e.g. "half-soldered HMR pipe", "jar of deflaked tests"). Stay concrete',
        'to the actual commit messages. No emoji.',
      ].join('\n'),
    });

    return specSchema.parse(object);
  } catch {
    return null;
  }
}
