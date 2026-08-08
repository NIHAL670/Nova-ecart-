'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, BadgePercent } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@/types';
import { ProductImage } from './ProductImage';
import { WishlistButton } from './WishlistButton';
import { Rating } from '@/components/common/Rating';
import { Price } from '@/components/common/Price';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cartStore';

interface ProductCardProps {
  product: Product;
  index?: number;
  priority?: boolean;
}

export function ProductCard({ product, index = 0, priority }: ProductCardProps) {
  const add = useCartStore((s) => s.add);
  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.effectivePrice);
  const out = product.stock === 0;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.4) }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow duration-300 hover:shadow-raised"
    >
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative">
          <ProductImage src={product.images[0]?.url ?? ''} alt={product.name} priority={priority} />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {onSale && (
              <Badge variant="sale" className="shadow-sm">
                <BadgePercent className="h-3 w-3" /> -{product.discountPercent}%
              </Badge>
            )}
            {product.isNewArrival && <Badge variant="secondary">New</Badge>}
            {out && <Badge variant="destructive">Out of stock</Badge>}
          </div>
          <div className="absolute right-3 top-3">
            <WishlistButton productId={product._id} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          {product.brand && <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.brand}</span>}
          <h3 className="line-clamp-1 text-sm font-medium">{product.name}</h3>
          <Rating value={product.rating} count={product.reviewCount} />
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <Price price={product.effectivePrice} compareAtPrice={product.compareAtPrice} currency={product.currency} />
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <Button className="w-full" disabled={out} onClick={quickAdd}>
          <Plus className="h-4 w-4" /> Add to cart
        </Button>
      </div>
    </motion.div>
  );
}