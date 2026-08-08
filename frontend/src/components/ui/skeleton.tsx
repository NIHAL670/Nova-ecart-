import { cn } from '@/lib/utils';

/** Shimmering placeholder — add `skeleton` class for the animated effect. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton rounded-xl bg-muted', className)} {...props} />;
}

export { Skeleton };