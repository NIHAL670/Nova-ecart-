import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface PriceProps {
  price: number;
  compareAtPrice?: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' } as const;

/** Price display with optional strikethrough compare-at price. */
export function Price({ price, compareAtPrice, currency = 'USD', size = 'md', className }: PriceProps) {
  const onSale = compareAtPrice && compareAtPrice > price;
  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className={cn('font-semibold text-foreground', sizes[size])}>{formatCurrency(price, currency)}</span>
      {onSale && (
        <span className={cn('text-muted-foreground line-through', size === 'lg' ? 'text-lg' : 'text-xs')}>
          {formatCurrency(compareAtPrice, currency)}
        </span>
      )}
    </div>
  );
}