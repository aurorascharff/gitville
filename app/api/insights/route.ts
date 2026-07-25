import { getInsights } from '@/features/insight/insight-queries';

// Live aggregate for the Insights charts; polled by the client.
export async function GET(): Promise<Response> {
  const data = await getInsights();
  return Response.json(data);
}
