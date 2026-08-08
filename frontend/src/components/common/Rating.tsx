import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
  className?: string;
  showCount?: boolean;
}

/** Star rating — full/partial stars with optional review count. */
export function Rating({ value, count, size = 'sm', className, showCount = true }: RatingProps) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.3;
  const starClass = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={i} className={cn(starClass, 'fill-current')} />
        ))}
        {hasHalf && full < 5 && <StarHalf className={cn(starClass, 'fill-current')} />}
        {Array.from({ length: Math.max(0, 5 - full - (hasHalf ? 1 : 0)) }).map((_, i) => (
          <Star key={`e${i}`} className={cn(starClass, 'text-muted')} />
        ))}
      </div>
      {showCount && typeof count === 'number' && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}