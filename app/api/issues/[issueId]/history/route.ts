import { getIssueEvents } from '@/features/activity/activity-queries';

export async function GET(_request: Request, { params }: RouteContext<'/api/issues/[issueId]/history'>) {
  const { issueId } = await params;
  const events = await getIssueEvents(issueId);
  return Response.json(events);
}
