'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Heart, HeartCrack } from 'lucide-react';
import { fetchWishlist } from '@/services/wishlist.service';
import { queryKeys } from '@/constants';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/common/RequireAuth';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductGridSkeleton } from '@/components/product/ProductSkeleton';

function WishlistContent() {
  const wishlistQuery = useQuery({
    queryKey: queryKeys.wishlist,
    queryFn: () => fetchWishlist(),
  });

  const products = wishlistQuery.data ?? [];

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center gap-2">
        <Heart className="h-5 w-5 text-rose-500" />
        <h1 className="font-display text-3xl font-bold tracking-tight">My Wishlist</h1>
      </div>

      {wishlistQuery.isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={HeartCrack}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here for later."
          action={
            <Button asChild>
              <Link href="/products">Browse products</Link>
            </Button>
          }
        />
      ) : (
        <ProductGrid products={products} columns={4} />
      )}
    </div>
  );
}

export default function WishlistPage() {
  return (
    <RequireAuth>
      <WishlistContent />
    </RequireAuth>
  );
}
