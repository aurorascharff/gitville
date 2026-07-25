import { getIssuesForView } from '@/features/issue/issue-queries';
import { maybeSimulateActivity } from '@/features/issue/simulate';
import { getCurrentUserId } from '@/features/user/user-queries';

// Live issue snapshot for a view; polled by the client. Each poll also nudges the
// simulated teammates so the board keeps moving.
export async function GET(request: Request) {
  const view = new URL(request.url).searchParams.get('view') ?? 'active';
  await maybeSimulateActivity();
  const userId = await getCurrentUserId();
  const issues = await getIssuesForView(view, userId);
  return Response.json(issues);
}
