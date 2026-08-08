'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{error.message || 'An unexpected error occurred.'}</p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}