import { getIssueByKey } from '@/features/issue/issue-queries';

export async function GET(_request: Request, { params }: RouteContext<'/api/issue/[key]'>) {
  const { key } = await params;
  const issue = await getIssueByKey(key);
  return Response.json(issue);
}
