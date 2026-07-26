'use client';

import { TriangleAlert } from 'lucide-react';
import { catchError, type ErrorInfo } from 'next/error';
import { Button } from '@/components/ui/button';

function ErrorFallback(props: { title?: string }, { retry }: ErrorInfo) {
  return (
    <div className="bg-card flex flex-col items-center gap-3 rounded-lg border px-5 py-10 text-center">
      <TriangleAlert className="text-destructive h-5 w-5" />
      <p className="text-sm font-medium">{props.title ?? 'Something went wrong'}</p>
      <Button variant="secondary" size="sm" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}

// Next-aware boundary: understands notFound()/redirect() throws and re-fetches on retry.
export default catchError(ErrorFallback);
