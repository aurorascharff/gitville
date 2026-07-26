import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RepoNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-lg font-semibold tracking-tight">No hive here</h1>
      <p className="text-muted-foreground text-sm">That repo doesn’t exist on GitHub, or it’s private.</p>
      <Button asChild variant="secondary" size="sm">
        <Link href="/">Back to the hive</Link>
      </Button>
    </div>
  );
}
