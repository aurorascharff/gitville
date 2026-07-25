'use client';

import { Loader2, Rocket } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { redeployProject } from '@/features/deployment/deployment-actions';

export function DeployButton({ projectId }: { projectId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={() =>
        startTransition(async () => {
          const result = await redeployProject(projectId);
          // Only returns on failure — success redirects to the new deployment.
          if (result && !result.ok) toast.error(result.error);
        })
      }
    >
      <Button type="submit" size="sm" disabled={pending} aria-label={pending ? 'Deploying' : 'Deploy'}>
        {pending ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} strokeWidth={1.8} />}
        <span>{pending ? 'Deploying' : 'Deploy'}</span>
      </Button>
    </form>
  );
}
