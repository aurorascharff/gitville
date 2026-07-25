'use client';

import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
      <TriangleAlert className="h-6 w-6 text-destructive" />
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">An unexpected error occurred while loading this page.</p>
      <Button variant="secondary" size="sm" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
