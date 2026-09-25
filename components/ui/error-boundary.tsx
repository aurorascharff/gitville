'use client';

import { LoaderCircle } from 'lucide-react';
import { catchError, type ErrorInfo } from 'next/error';
import { useTransition, type ComponentType } from 'react';

type ErrorBoundaryFallbackProps = ErrorInfo & {
  title?: string;
};

type ErrorBoundaryProps = {
  fallbackComponent?: ComponentType<ErrorBoundaryFallbackProps>;
  title?: string;
};

function ErrorFallback(
  { fallbackComponent: Fallback = DefaultErrorFallback, title }: ErrorBoundaryProps,
  errorInfo: ErrorInfo,
) {
  return <Fallback {...errorInfo} title={title} />;
}

function DefaultErrorFallback({ retry, title }: ErrorBoundaryFallbackProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm font-medium">{title ?? 'Something went wrong.'}</p>
      <button
        aria-busy={isPending}
        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10"
        disabled={isPending}
        onClick={() => startTransition(() => retry())}
      >
        {isPending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
        {isPending ? 'Retrying…' : 'Try again'}
      </button>
    </div>
  );
}

export const ErrorBoundary = catchError(ErrorFallback);
