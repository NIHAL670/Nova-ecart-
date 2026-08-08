'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowRight,
  BadgePercent,
  ChevronLeft,
  PackageSearch,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Zap,
} from 'lucide-react';
import type { ProductVariant } from '@/types';
import { fetchProductBySlug, fetchRelated } from '@/services/catalog.service';
import { getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/constants';
import { cn, timeAgo } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Price } from '@/components/common/Price';
import { Rating } from '@/components/common/Rating';
import { QuantityStepper } from '@/components/common/QuantityStepper';
import { ProductImage } from '@/components/product/ProductImage';
import { WishlistButton } from '@/components/product/WishlistButton';
import { ProductsCarousel } from '@/components/product/ProductsCarousel';
import { ProductCardSkeleton } from '@/components/product/ProductSkeleton';
import { ReviewsList } from '@/components/product/ReviewsList';
import { ReviewForm } from '@/components/product/ReviewForm';
import { useCartStore } from '@/store/cartStore';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';

function ProductDetail() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const addToCart = useCartStore((s) => s.add);
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.add);

  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const initialVariant = searchParams.get('variant') ?? undefined;

  const [imageIndex, setImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(initialVariant);
  const [quantity, setQuantity] = useState(1);

  const productQuery = useQuery({
    queryKey: queryKeys.product(slug),
    queryFn: () => fetchProductBySlug(slug),
    enabled: Boolean(slug),
  });
  const product = productQuery.data;

  const relatedQuery = useQuery({
    queryKey: queryKeys.related(product?._id ?? ''),
    queryFn: () => fetchRelated(product!._id),
    enabled: Boolean(product),
  });

  // Record the view (once per product) for the "recently viewed" strip.
  useEffect(() => {
    if (product) addRecentlyViewed(product);
  }, [product, addRecentlyViewed]);

  useEffect(() => {
    if (product && product.images.length > 0) setImageIndex(0);
  }, [product]);

  const variants: ProductVariant[] = useMemo(() => product?.variants ?? [], [product]);

  const variant = useMemo(
    () => variants.find((v) => v.name === selectedVariant),
    [variants, selectedVariant],
  );

  const displayPrice = variant?.price ?? product?.effectivePrice ?? product?.price ?? 0;
  const displayStock = variant ? variant.stock : product?.stock ?? 0;
  const images = product?.images ?? [];

  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant]);

  const resetTo = (i: number) => setImageIndex(i);

  const handleAdd = (goToCart: boolean) => {
    if (!product) return;
    if (displayStock <= 0) {
      toast.error('This item is currently out of stock.');
      return;
    }
    addToCart(product, quantity);
    toast.success(`${quantity} × ${product.name} added to cart`);
    if (goToCart) router.push('/checkout');
  };

  /* ------------------------- Loading state ------------------------- */
  if (productQuery.isLoading) {
    return (
      <div className="container py-10">
        <Skeleton className="mb-6 h-4 w-48" />
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
            <div className="hidden flex-col gap-3 sm:flex">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-20" />
              ))}
            </div>
            <Skeleton className="aspect-square w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-2 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-16 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
        </div>
        <div className="mt-16">
          <Skeleton className="mb-6 h-8 w-56" />
          <div className="flex gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-60 shrink-0">
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-3 py-16 text-center">
        <PackageSearch className="h-12 w-12 text-muted-foreground" />
        <h1 className="font-display text-xl font-bold">Product not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {productQuery.isError ? getErrorMessage(productQuery.error) : 'This product is unavailable or was removed.'}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/products">
            <ChevronLeft className="h-4 w-4" /> Back to products
          </Link>
        </Button>
      </div>
    );
  }

  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.effectivePrice);
  const out = displayStock === 0;
  const lowStock = !out && displayStock > 0 && displayStock <= 5;

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground">Products</Link>
        <span>/</span>
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* ---------------- Gallery ---------------- */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="hidden flex-col gap-3 sm:flex">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => resetTo(i)}
                className={cn(
                  'overflow-hidden rounded-xl border-2 transition-colors',
                  i === imageIndex ? 'border-primary' : 'border-transparent hover:border-border',
                )}
                aria-label={`View image ${i + 1}`}
              >
                <ProductImage src={img.url} alt={`${product.name} thumbnail ${i + 1}`} className="h-20 w-20" />
              </button>
            ))}
          </div>

          <div className="group relative flex-1 overflow-hidden rounded-2xl border">
            <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
              {onSale && (
                <Badge variant="sale" className="shadow-sm">
                  <BadgePercent className="h-3 w-3" /> -{product.discountPercent}%
                </Badge>
              )}
              {out && <Badge variant="destructive">Out of stock</Badge>}
              {product.isNewArrival && <Badge variant="secondary">New</Badge>}
            </div>
            <div className="absolute right-3 top-3 z-10">
              <WishlistButton productId={product._id} />
            </div>
            <ProductImage src={images[imageIndex]?.url ?? ''} alt={product.name} priority className="aspect-square" />
          </div>

          {/* Mobile horizontal thumbnails */}
          <div className="flex gap-2 overflow-x-auto py-1 sm:hidden">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => resetTo(i)}
                className={cn(
                  'shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                  i === imageIndex ? 'border-primary' : 'border-transparent hover:border-border',
                )}
                aria-label={`View image ${i + 1}`}
              >
                <ProductImage src={img.url} alt={`${product.name} thumbnail ${i + 1}`} className="h-12 w-12" />
              </button>
            ))}
          </div>
        </div>

        {/* ---------------- Info ---------------- */}
        <div>
          {product.brand && (
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{product.brand}</p>
          )}
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <Rating value={product.rating} count={product.reviewCount} />
            <span className="text-xs text-muted-foreground">{product.soldCount > 0 ? `${product.soldCount} sold` : 'New'}</span>
          </div>

          <Price price={displayPrice} compareAtPrice={product.compareAtPrice} currency={product.currency} size="lg" className="mt-5" />

          {product.shortDescription && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.shortDescription}</p>
          )}

          {/* Stock indicator */}
          <div className="mt-4">
            {out ? (
              <Badge variant="destructive">Out of stock</Badge>
            ) : lowStock ? (
              <Badge variant="warning">Only {displayStock} left</Badge>
            ) : (
              <Badge variant="success">In stock</Badge>
            )}
          </div>

          {/* Variants */}
          {variants.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">Options</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const active = selectedVariant === v.name;
                  return (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => setSelectedVariant(v.name)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm transition-colors',
                        active
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : v.stock === 0
                            ? 'cursor-not-allowed border-border text-muted-foreground line-through'
                            : 'hover:border-primary/50',
                      )}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <Separator className="my-6" />

          {/* Quantity + actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <QuantityStepper value={quantity} onChange={setQuantity} max={Math.max(1, displayStock)} />
            <div className="flex flex-1 gap-3">
              <Button className="flex-1" disabled={out} onClick={() => handleAdd(false)}>
                <ShoppingCart className="h-4 w-4" /> Add to cart
              </Button>
              <Button className="flex-1" variant="soft" disabled={out} onClick={() => handleAdd(true)}>
                <Zap className="h-4 w-4" /> Buy now
              </Button>
            </div>
          </div>

          {/* Trust row */}
          <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border bg-muted/30 p-4 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4 shrink-0 text-primary" /> Free shipping over $50
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <RotateCcw className="h-4 w-4 shrink-0 text-primary" /> 30-day returns
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" /> Secure checkout
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Tabs ---------------- */}
      <div className="mt-16">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.reviewCount})</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="py-6">
            <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground">
              {product.description.split('\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="py-6">
            <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
              <ReviewsList productId={product._id} />
              <ReviewForm productId={product._id} />
            </div>
          </TabsContent>

          <TabsContent value="details" className="py-6">
            <div className="max-w-xl overflow-hidden rounded-2xl border">
              <dl className="divide-y divide-border text-sm">
                {[
                  ['SKU', product.sku ?? '—'],
                  ['Brand', product.brand ?? '—'],
                  ['Category', typeof product.category === 'string' ? product.category : product.category?.name ?? '—'],
                  ['Stock', `${product.stock} units`],
                  ['Tags', product.tags.join(', ') || '—'],
                  ['Added', product.createdAt ? timeAgo(product.createdAt) : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-4 px-5 py-3">
                    <dt className="w-32 shrink-0 font-medium text-muted-foreground">{label}</dt>
                    <dd className="text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ---------------- Related ---------------- */}
      {relatedQuery.data && relatedQuery.data.length > 0 && (
        <div className="mt-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold tracking-tight">You may also like</h2>
            <Link href="/products" className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          {relatedQuery.isLoading ? (
            <div className="flex gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-60 shrink-0"><ProductCardSkeleton /></div>
              ))}
            </div>
          ) : (
            <ProductsCarousel products={relatedQuery.data ?? []} />
          )}
        </div>
      )}
      {/* ---------------- Recently Viewed ---------------- */}
      <RecentlyViewedStrip currentId={product._id} />
    </div>
  );
}

function RecentlyViewedStrip({ currentId }: { currentId: string }) {
  const items = useRecentlyViewedStore((s) => s.items);
  const filtered = useMemo(() => items.filter((i) => i._id !== currentId), [items, currentId]);

  if (filtered.length === 0) return null;

  return (
    <div className="mt-16">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold tracking-tight">Recently viewed</h2>
      </div>
      <ProductsCarousel products={filtered} />
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        <div className="container grid gap-10 py-10 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      }
    >
      <ProductDetail />
    </Suspense>
  );
}