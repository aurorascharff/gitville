import { getUnseenCount } from '@/features/activity/activity-queries';
import type { NotificationsPayload } from '@/types/event';

export async function GET(): Promise<Response> {
  const count = await getUnseenCount();
  return Response.json({ count } satisfies NotificationsPayload);
}
