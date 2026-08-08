'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetchProductsAll, adminUpdateProduct } from '@/services/admin.service';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Category, Product } from '@/types';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const ADMIN_PRODUCTS_KEY = ['admin', 'products'] as const;

type StockFilter = 'all' | 'in' | 'low' | 'out';

function categoryName(category: string | Category | undefined): string {
  if (!category) return '—';
  return typeof category === 'object' ? category.name : category;
}

function stockTone(stock: number): 'success' | 'warning' | 'destructive' {
  if (stock === 0) return 'destructive';
  if (stock < 5) return 'warning';
  return 'success';
}

function stockLabel(stock: number): string {
  if (stock === 0) return 'Out of stock';
  if (stock < 5) return 'Low stock';
  return 'In stock';
}

function StockEditor({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(String(product.stock));

  useEffect(() => setValue(String(product.stock)), [product.stock]);

  const mutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) => {
      const fd = new FormData();
      fd.set('stock', String(Math.max(0, Math.round(stock))));
      return adminUpdateProduct(id, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
      toast.success('Stock updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const pending = mutation.isPending && mutation.variables?.id === product._id;

  const commit = () => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n) || n === product.stock) return;
    mutation.mutate({ id: product._id, stock: n });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="icon-sm"
        disabled={pending || product.stock <= 0}
        aria-label="Decrease stock"
        onClick={() => mutation.mutate({ id: product._id, stock: product.stock - 1 })}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className="h-8 w-16 text-center text-sm"
        aria-label="Stock quantity"
      />
      <Button
        variant="outline"
        size="icon-sm"
        disabled={pending}
        aria-label="Increase stock"
        onClick={() => mutation.mutate({ id: product._id, stock: product.stock + 1 })}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function AdminInventoryPage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ADMIN_PRODUCTS_KEY,
    queryFn: adminFetchProductsAll,
  });
  const [filter, setFilter] = useState<StockFilter>('all');
  const [search, setSearch] = useState('');

  const all = products ?? [];

  const visible = all.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'in') return p.stock >= 5;
    if (filter === 'low') return p.stock > 0 && p.stock < 5;
    if (filter === 'out') return p.stock === 0;
    return true;
  });

  const FILTERS: { key: StockFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: all.length },
    { key: 'in', label: 'In stock', count: all.filter((p) => p.stock >= 5).length },
    { key: 'low', label: 'Low stock', count: all.filter((p) => p.stock > 0 && p.stock < 5).length },
    { key: 'out', label: 'Out of stock', count: all.filter((p) => p.stock === 0).length },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Inventory</CardTitle>
            <CardDescription>Track stock levels and adjust quantities</CardDescription>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-52 pl-9 sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex w-fit flex-wrap items-center gap-1 rounded-full border bg-muted/40 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                  filter === f.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}{' '}
                <span className={filter === f.key ? 'text-primary-foreground/80' : 'text-muted-foreground/70'}>
                  ({f.count})
                </span>
              </button>
            ))}
          </div>
          <DataTable<Product>
            isLoading={isLoading}
            data={visible}
            rowKey={(p) => p._id}
            columns={[
              { key: 'product', header: 'Product', cell: (p) => <span className="text-sm font-medium">{p.name}</span> },
              { key: 'sku', header: 'SKU', cell: (p) => <span className="text-sm text-muted-foreground">{p.sku ?? '—'}</span> },
              {
                key: 'category',
                header: 'Category',
                cell: (p) => <span className="text-sm text-muted-foreground">{categoryName(p.category)}</span>,
              },
              { key: 'stock', header: 'Stock', cell: (p) => <StockEditor product={p} /> },
              {
                key: 'level',
                header: 'Level',
                cell: (p) => <Badge variant={stockTone(p.stock)}>{stockLabel(p.stock)}</Badge>,
              },
            ]}
            emptyTitle="No products match"
            emptyDescription="Adjust the filter or search to see more."
          />
        </CardContent>
      </Card>
    </div>
  );
}