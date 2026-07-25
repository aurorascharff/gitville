import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProjectNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
      <h1 className="text-lg font-semibold">Project not found</h1>
      <p className="text-sm text-muted-foreground">This project doesn’t exist or was removed.</p>
      <Button asChild variant="secondary" size="sm">
        <Link href="/">Back to projects</Link>
      </Button>
    </div>
  );
}
