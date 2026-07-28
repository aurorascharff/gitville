'use client';

import { catchError, type ErrorInfo } from 'next/error';
import { createContext, useContext, type ReactNode } from 'react';

const ErrorBoundaryContext = createContext<ErrorInfo | null>(null);

export function useErrorBoundary(): ErrorInfo {
  const info = useContext(ErrorBoundaryContext);
  if (!info) throw new Error('useErrorBoundary must be used inside <ErrorBoundary>');
  return info;
}

function ErrorFallback({ fallback }: { fallback?: ReactNode }, errorInfo: ErrorInfo) {
  return (
    <ErrorBoundaryContext.Provider value={errorInfo}>
      {fallback ?? <DefaultErrorFallback />}
    </ErrorBoundaryContext.Provider>
  );
}

function DefaultErrorFallback() {
  const { retry } = useErrorBoundary();

  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm font-medium">Something went wrong.</p>
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
