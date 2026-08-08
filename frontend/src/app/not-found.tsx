import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <SearchX className="h-10 w-10" />
      </div>
      <h1 className="font-display text-4xl font-bold">404</h1>
      <p className="max-w-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      <Button asChild size="lg">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}