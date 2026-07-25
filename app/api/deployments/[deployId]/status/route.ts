import { getDeploymentStatus } from '@/features/deployment/deployment-status';

// Dynamic by default under Cache Components (reads params + DB) — always fresh for polling.
export async function GET(_request: Request, { params }: RouteContext<'/api/deployments/[deployId]/status'>) {
  const { deployId } = await params;
  const payload = await getDeploymentStatus(deployId);
  return Response.json(payload);
}
