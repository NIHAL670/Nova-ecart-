'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Loader2, PackageCheck, ShoppingBag } from 'lucide-react';
import { RequireAuth } from '@/components/common/RequireAuth';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductImage } from '@/components/product/ProductImage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchMyOrders, cancelOrder } from '@/services/order.service';
import { getErrorMessage } from '@/lib/api';
import { queryKeys, orderStatusStyles } from '@/constants';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { OrderStatus } from '@/types';

const CANCELLABLE: OrderStatus[] = ['pending', 'placed', 'confirmed', 'processing'];

function OrdersPageContent() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.orders(page),
    queryFn: () => fetchMyOrders(page),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: (order) => {
      toast.success(`Order ${order.orderNumber} cancelled`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not cancel order'),
  });

  const orders = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="container py-12 sm:py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Your Orders</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-28 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="When you place an order it will show up here. Explore the catalogue to get started."
          action={
            <Button asChild>
              <Link href="/products">Start shopping</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => {
              const status = orderStatusStyles[order.status];
              const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
              const first = order.items[0];
              return (
                <Card key={order._id} className="transition-shadow hover:shadow-raised">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center gap-4">
                      {first && (
                        <Link href={`/orders/${order._id}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                          <ProductImage src={first.image} alt={first.name} sizes="64px" />
                        </Link>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/orders/${order._id}`} className="font-semibold hover:underline">
                            #{order.orderNumber}
                          </Link>
                          <Badge className={status.className}>{status.label}</Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">Placed {formatDateTime(order.createdAt)}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{itemCount} item{itemCount === 1 ? '' : 's'}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className="text-lg font-bold">{formatCurrency(order.total, order.currency)}</span>
                        {CANCELLABLE.includes(order.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelMutation.mutate(order._id)}
                            disabled={cancelMutation.isPending}
                          >
                            {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                            Cancel order
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {meta && meta.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || isFetching}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                disabled={page >= meta.pages || isFetching}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersPageContent />
    </RequireAuth>
  );
}