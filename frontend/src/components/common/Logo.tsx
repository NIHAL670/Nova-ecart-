import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Brand logo — icon + wordmark in the display font. */
export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2', className)} aria-label="Nova Cart home">
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-600 text-primary-foreground shadow-soft transition-transform group-hover:scale-105">
        <ShoppingBag className="h-5 w-5" />
      </span>
      <span className="font-display text-xl font-bold tracking-tight">
        Nova<span className="text-gradient">Cart</span>
      </span>
    </Link>
  );
}