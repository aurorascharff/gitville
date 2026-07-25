'use client';

import { TriangleAlert } from 'lucide-react';
import { catchError, type ErrorInfo } from 'next/error';
import { Button } from '@/components/ui/button';

function ErrorFallback(props: { title?: string }, { retry }: ErrorInfo) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-5 py-10 text-center">
      <TriangleAlert className="h-5 w-5 text-destructive" />
      <p className="text-sm font-medium">{props.title ?? 'Something went wrong'}</p>
      <Button variant="secondary" size="sm" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}

// Next-aware boundary: understands notFound()/redirect() throws and re-fetches on retry.
export default catchError(ErrorFallback);
