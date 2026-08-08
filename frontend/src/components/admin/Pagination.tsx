'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Collapse a page window into a compact list with ellipsis gaps. */
function pageWindow(page: number, pages: number): (number | '…')[] {
  const set = new Set<number>([1, pages, page - 1, page, page + 1]);
  const sorted = [...set].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

/** Prev/next + page numbers + jump-to-page input for admin paginated tables. */
export function Pagination({ page, pages, onPageChange, className }: PaginationProps) {
  const [jump, setJump] = useState('');
  const window = useMemo(() => pageWindow(page, pages), [page, pages]);

  if (pages <= 1) return null;

  const go = (next: number) => {
    if (next >= 1 && next <= pages && next !== page) onPageChange(next);
  };

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 px-1 py-4', className)}>
      <p className="text-sm text-muted-foreground">
        Page {page} of {pages}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {window.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="px-1.5 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              className={cn(
                'h-8 w-8 rounded-full text-sm font-medium transition-colors',
                p === page
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {p}
            </button>
          ),
        )}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => go(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <form
          className="ml-1 flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseInt(jump, 10);
            if (!Number.isNaN(n)) go(n);
            setJump('');
          }}
        >
          <Input
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            className="h-8 w-16 px-2 text-center text-sm"
            placeholder="Go"
            aria-label="Jump to page"
          />
        </form>
      </div>
    </div>
  );
}