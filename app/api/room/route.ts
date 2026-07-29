import { getRoomSpecPayload } from '@/features/village/village-queries';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') ?? '';
  const cellId = url.searchParams.get('cell') ?? '';
  if (!slug.includes('/') || !cellId) return Response.json({ ok: false }, { status: 400 });

  const spec = await getRoomSpecPayload(slug, cellId);
  if (!spec) return Response.json({ ok: false }, { status: 404 });
  return Response.json(spec);
}
