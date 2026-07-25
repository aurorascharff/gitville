import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DeployForm } from '@/features/deployment/components/deploy-form';

export const metadata = { title: 'New Deployment' };
// Keep the request alive long enough for the simulated build's after() task on Vercel.
export const maxDuration = 60;

export default function NewDeploymentPage() {
  return (
    <div className="mx-auto max-w-lg">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft size={13} strokeWidth={1.75} />
        Back to projects
      </Link>
      <div className="mt-3 rounded-lg border bg-card p-5">
        <h1 className="text-lg font-semibold">New deployment</h1>
        <p className="mt-1 mb-5 text-xs text-muted-foreground">
          Paste a public GitHub repo. Locally with real deploys enabled it spins up a Vercel Sandbox and streams live
          build logs; otherwise it runs a simulated build.
        </p>
        <DeployForm />
      </div>
    </div>
  );
}
