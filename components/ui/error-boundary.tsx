'use client';

import { catchError, type ErrorInfo } from 'next/error';
import type { ComponentType } from 'react';

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
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm font-medium">{title ?? 'Something went wrong.'}</p>
      <button
        onClick={() => retry()}
        className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      >
        Try again
      </button>
    </div>
  );
}

export const ErrorBoundary = catchError(ErrorFallback);
