'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import type { Category } from '@/types';
import { fetchCategoryTree, fetchProducts, type ProductQuery } from '@/services/catalog.service';
import { getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/constants';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductGridSkeleton } from '@/components/product/ProductSkeleton';
import { useDebounce } from '@/hooks/useDebounce';

const PAGE_SIZE = 12;

const sortOptions = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'price', label: 'Price: low to high' },
  { value: '-price', label: 'Price: high to low' },
  { value: '-rating', label: 'Top rated' },
  { value: '-soldCount', label: 'Best selling' },
  { value: '-discountPercent', label: 'Best Deals' },
];

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Read filters from the URL (single source of truth) ---
  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? undefined;
  const subCategory = searchParams.get('subCategory') ?? undefined;
  const brand = searchParams.get('brand') ?? undefined;
  const sort = searchParams.get('sort') ?? '-createdAt';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const priceMinRaw = searchParams.get('priceMin');
  const priceMaxRaw = searchParams.get('priceMax');
  const priceMin = priceMinRaw ? Number(priceMinRaw) : undefined;
  const priceMax = priceMaxRaw ? Number(priceMaxRaw) : undefined;

  const [searchInput, setSearchInput] = useState(search);
  const [minInput, setMinInput] = useState(priceMinRaw ?? '');
  const [maxInput, setMaxInput] = useState(priceMaxRaw ?? '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 350);

  const setSearchParams = useCallback(
    (updates: Record<string, string | number | undefined>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === null) params.delete(key);
        else params.set(key, String(value));
      });
      if (resetPage) params.delete('page');
      router.replace(`/products?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  // Keep the debounced search in the URL.
  useEffect(() => {
    if (debouncedSearch !== search) {
      setSearchParams({ search: debouncedSearch || undefined });
    }
  }, [debouncedSearch, search, setSearchParams]);

  // Sync URL search param back to input state.
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Sync URL price params back to input states.
  useEffect(() => {
    setMinInput(priceMinRaw ?? '');
    setMaxInput(priceMaxRaw ?? '');
  }, [priceMinRaw, priceMaxRaw]);

  const clearAll = useCallback(() => {
    router.replace('/products', { scroll: false });
  }, [router]);

  // --- Queries ---
  const productParams = useMemo<ProductQuery>(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      category: category || undefined,
      subCategory: subCategory || undefined,
      brand: brand || undefined,
      sort: sort || undefined,
      priceMin: Number.isFinite(priceMin) ? priceMin : undefined,
      priceMax: Number.isFinite(priceMax) ? priceMax : undefined,
    }),
    [page, search, category, subCategory, brand, sort, priceMin, priceMax],
  );

  const productsQuery = useQuery({
    queryKey: queryKeys.products(JSON.stringify(productParams)),
    queryFn: () => fetchProducts(productParams),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categoryTree,
    queryFn: () => fetchCategoryTree(),
  });

  // Brand list sourced from a broad product snapshot.
  const brandsQuery = useQuery({
    queryKey: queryKeys.products('brand-source'),
    queryFn: () => fetchProducts({ limit: 100, sort: 'best-selling' }),
    staleTime: 5 * 60_000,
  });
  const brands = useMemo(() => {
    const set = new Set<string>();
    (brandsQuery.data?.items ?? []).forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort();
  }, [brandsQuery.data]);

  const items = productsQuery.data?.items ?? [];
  const relatedProductsQuery = useQuery({
    queryKey: ['products-related-fallback'],
    queryFn: () => fetchProducts({ limit: 6, sort: 'best-selling' }),
    enabled: items.length === 0,
  });
  const meta = productsQuery.data?.meta;
  const total = meta?.total ?? 0;
  const hasFilters = Boolean(search || category || subCategory || brand || priceMinRaw || priceMaxRaw);

  const applyPrice = () => {
    const min = Number(minInput);
    const max = Number(maxInput);
    setSearchParams({
      priceMin: minInput.trim() !== '' && Number.isFinite(min) ? min : undefined,
      priceMax: maxInput.trim() !== '' && Number.isFinite(max) ? max : undefined,
    });
    if (min > max && Number.isFinite(min) && Number.isFinite(max)) {
      toast.warning('Min price is greater than max price');
    }
  };

  const renderCategory = (c: Category, depth: number) => {
    const children = (c.children ?? []).filter((ch) => ch.isActive !== false);
    const isActive = category === c._id || subCategory === c._id;
    return (
      <div key={c._id} className="space-y-0.5">
        <button
          type="button"
          onClick={() => setSearchParams({ category: category === c._id ? undefined : c._id, subCategory: undefined })}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent',
            isActive ? 'bg-accent font-medium text-accent-foreground' : 'text-foreground',
          )}
        >
          <span className={cn(depth > 0 && 'pl-4')}>{c.name}</span>
          {typeof c.productCount === 'number' && (
            <span className="text-xs text-muted-foreground">{c.productCount}</span>
          )}
        </button>
        {children.map((child) => renderCategory(child, depth + 1))}
      </div>
    );
  };

  const pageNumbers = useMemo(() => {
    if (!meta || meta.pages <= 1) return [];
    const pages = meta.pages;
    const current = meta.page;
    const windowSize = 5;
    let start = Math.max(1, current - 2);
    const end = Math.min(pages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [meta]);

  const sidebar = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products…"
            className="pl-10"
            aria-label="Search products"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categories</Label>
          <span className="text-xs text-muted-foreground">{total} products</span>
        </div>
        {categoriesQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">{categoriesQuery.data?.map((c) => renderCategory(c, 0))}</div>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Brands</Label>
        {brands.length === 0 ? (
          <p className="text-xs text-muted-foreground">No brands available.</p>
        ) : (
          <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
            {brands.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setSearchParams({ brand: brand === b ? undefined : b })}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                  brand === b ? 'bg-accent font-medium text-accent-foreground' : 'text-foreground',
                )}
              >
                {b}
              </button>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price range</Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {formatCurrency(0, 'USD').slice(0, 1)}
            </span>
            <Input
              type="number"
              min={0}
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              placeholder="Min"
              className="pl-7"
              aria-label="Minimum price"
            />
          </div>
          <span className="text-muted-foreground">–</span>
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {formatCurrency(0, 'USD').slice(0, 1)}
            </span>
            <Input
              type="number"
              min={0}
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              placeholder="Max"
              className="pl-7"
              aria-label="Maximum price"
            />
          </div>
        </div>
        <Button type="button" variant="secondary" size="sm" className="w-full" onClick={applyPrice}>
          Apply price
        </Button>
      </div>

      <Separator />

      {hasFilters && (
        <Button type="button" variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={clearAll}>
          <X className="h-4 w-4" /> Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Shop all products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {productsQuery.isLoading ? 'Loading products…' : `${total} product${total === 1 ? '' : 's'} found`}
        </p>
      </div>

      {/* Mobile filter toggle */}
      <div className="mb-6 flex items-center justify-between lg:hidden">
        <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen((v) => !v)}>
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {hasFilters && <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">•</span>}
        </Button>
        <SortSelect value={sort} onChange={(v) => setSearchParams({ sort: v })} />
      </div>

      {filtersOpen && (
        <div className="mb-8 rounded-2xl border bg-card p-5 shadow-soft lg:hidden">{sidebar}</div>
      )}

      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border bg-card p-5 shadow-soft">{sidebar}</div>
        </aside>

        <div>
          {/* Top toolbar */}
          <div className="mb-6 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Showing{' '}
              <span className="font-medium text-foreground">
                {meta ? Math.min((meta.page - 1) * meta.limit + 1, total) : 0}–{Math.min((meta?.page ?? 1) * PAGE_SIZE, total)}
              </span>{' '}
              of <span className="font-medium text-foreground">{total}</span>
            </p>
            <div className="hidden lg:block">
              <SortSelect value={sort} onChange={(v) => setSearchParams({ sort: v })} />
            </div>
          </div>

          {productsQuery.isLoading ? (
            <ProductGridSkeleton count={PAGE_SIZE} />
          ) : productsQuery.isError ? (
            <EmptyState
              icon={SearchX}
              title="Could not load products"
              description={getErrorMessage(productsQuery.error)}
              action={
                <Button variant="outline" size="sm" onClick={() => productsQuery.refetch()}>
                  Try again
                </Button>
              }
            />
          ) : items.length === 0 ? (
            <div className="space-y-8">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-center dark:border-amber-500/20 dark:bg-amber-500/5">
                <SearchX className="mx-auto h-10 w-10 text-amber-600 dark:text-amber-400" />
                <h3 className="mt-4 text-base font-semibold">No results found for your search</h3>
                <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or searching for something else.</p>
                <Button size="sm" variant="outline" className="mt-4" onClick={clearAll}>
                  Clear all filters
                </Button>
              </div>

              {relatedProductsQuery.data?.items && relatedProductsQuery.data.items.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <h2 className="font-display text-lg font-bold">Related items you might like</h2>
                  </div>
                  <ProductGrid products={relatedProductsQuery.data.items} columns={3} />
                </div>
              ) : (
                <EmptyState
                  icon={SearchX}
                  title="Product not available"
                  description="We are sorry, but there are no products available in the store at the moment."
                />
              )}
            </div>
          ) : (
            <>
              <ProductGrid products={items} columns={3} />
              {meta && meta.pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={meta.page <= 1}
                    onClick={() => setSearchParams({ page: meta.page - 1 }, false)}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {pageNumbers.map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={p === meta.page ? 'default' : 'outline'}
                      size="icon-sm"
                      onClick={() => setSearchParams({ page: p }, false)}
                      aria-current={p === meta.page ? 'page' : undefined}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={meta.page >= meta.pages}
                    onClick={() => setSearchParams({ page: meta.page + 1 }, false)}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}

function SortSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-auto min-w-[180px] rounded-full" aria-label="Sort products">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container py-10"><ProductGridSkeleton count={PAGE_SIZE} /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
