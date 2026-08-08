'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminDeleteProduct, adminFetchProductsAll } from '@/services/admin.service';
import { getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/constants';
import { formatCurrency, resolveMediaUrl } from '@/lib/utils';
import type { Category, Product } from '@/types';
import { DataTable } from '@/components/admin/DataTable';
import { ProductFormDialog } from '@/components/admin/ProductFormDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDebounce } from '@/hooks/useDebounce';

const ADMIN_PRODUCTS_KEY = ['admin', 'products'] as const;

function categoryName(category: string | Category | undefined): string {
  if (!category) return '—';
  return typeof category === 'object' ? category.name : category;
}

function statusVariant(status: Product['status']): 'success' | 'secondary' | 'outline' {
  if (status === 'active') return 'success';
  if (status === 'draft') return 'secondary';
  return 'outline';
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ADMIN_PRODUCTS_KEY,
    queryFn: adminFetchProductsAll,
  });

  const filtered = (products ?? []).filter((p) =>
    p.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.lowStock });
      toast.success('Product deleted');
      setDeleting(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Products</CardTitle>
            <CardDescription>
              {filtered.length} of {(products ?? []).length} products
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-52 pl-9 sm:w-64"
              />
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<Product>
            isLoading={isLoading}
            data={filtered}
            rowKey={(p) => p._id}
            columns={[
              {
                key: 'product',
                header: 'Product',
                cell: (p) => (
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border bg-muted">
                      {p.images[0] ? (
                        <Image src={resolveMediaUrl(p.images[0].url) ?? ''} alt={p.name} fill sizes="44px" className="object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                          —
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.sku ?? p._id}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'category',
                header: 'Category',
                cell: (p) => <span className="text-sm text-muted-foreground">{categoryName(p.category)}</span>,
              },
              {
                key: 'price',
                header: 'Price',
                cell: (p) => <span className="text-sm font-semibold">{formatCurrency(p.price, p.currency)}</span>,
              },
              {
                key: 'stock',
                header: 'Stock',
                cell: (p) => (
                  <span className={p.stock > 0 ? 'text-sm' : 'text-sm font-semibold text-destructive'}>
                    {p.stock}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                cell: (p) => <Badge variant={statusVariant(p.status)}>{p.status}</Badge>,
              },
              {
                key: 'rating',
                header: 'Rating',
                cell: (p) => (
                  <span className="inline-flex items-center gap-1 text-sm">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {p.rating.toFixed(1)}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                cell: (p) => (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${p.name}`}
                      onClick={() => {
                        setEditing(p);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${p.name}`}
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(p)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
            emptyTitle="No products found"
            emptyDescription={
              debouncedSearch ? 'Try a different search term.' : 'Add your first product to get started.'
            }
          />
        </CardContent>
      </Card>

      <ProductFormDialog product={editing} open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.name}&rdquo; will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleting) deleteMutation.mutate(deleting._id);
              }}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}