import { getComments } from '@/features/comment/comment-queries';

export async function GET(_request: Request, { params }: RouteContext<'/api/issues/[issueId]/comments'>) {
  const { issueId } = await params;
  const comments = await getComments(issueId);
  return Response.json(comments);
}
