import type { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  priority?: boolean;
  className?: string;
  columns?: 2 | 3 | 4 | 5;
}

const cols = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
};

export function ProductGrid({ products, priority, className, columns = 4 }: ProductGridProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4 sm:gap-5', cols[columns], className)}>
      {products.map((p, i) => (
        <ProductCard key={p._id} product={p} index={i} priority={priority && i < 4} />
      ))}
    </div>
  );
}