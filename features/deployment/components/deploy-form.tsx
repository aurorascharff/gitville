'use client';

import { Loader2, Rocket } from 'lucide-react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createDeploymentFromUrl } from '@/features/deployment/deployment-actions';

type State = { error?: string } | null;

async function action(_prev: State, formData: FormData): Promise<State> {
  const result = await createDeploymentFromUrl(formData);
  if (result && !result.ok) return { error: result.error };
  return null;
}

const EXAMPLES = ['vercel/next.js', 'vercel/ai', 'shadcn-ui/ui'];

export function DeployForm() {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="repoUrl" className="text-xs font-medium text-muted-foreground">
          GitHub repository
        </label>
        <Input
          id="repoUrl"
          name="repoUrl"
          type="text"
          required
          autoFocus
          placeholder="https://github.com/vercel/next.js"
          aria-describedby={state?.error ? 'repo-error' : undefined}
        />
      </div>
      {state?.error ? (
        <p id="repo-error" role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
      <p className="text-[11px] text-muted-foreground">
        Try{' '}
        {EXAMPLES.map((e, i) => (
          <span key={e}>
            <code className="font-mono">{e}</code>
            {i < EXAMPLES.length - 1 ? ', ' : ''}
          </span>
        ))}
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" strokeWidth={1.8} />}
      {pending ? 'Starting deployment' : 'Deploy'}
    </Button>
  );
}
