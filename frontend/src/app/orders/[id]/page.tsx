'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Loader2, MapPin, Package, PackageCheck, Truck } from 'lucide-react';
import { RequireAuth } from '@/components/common/RequireAuth';
import { OrderStatusTimeline } from '@/components/order/OrderStatusTimeline';
import { ProductImage } from '@/components/product/ProductImage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { fetchOrderById, cancelOrder } from '@/services/order.service';
import { getErrorMessage } from '@/lib/api';
import { queryKeys, orderStatusStyles, paymentMethodLabels } from '@/constants';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { OrderStatus } from '@/types';

const CANCELLABLE: OrderStatus[] = ['pending', 'placed', 'confirmed', 'processing'];

function OrderDetailContent() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => fetchOrderById(id),
    enabled: Boolean(id),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: (cancelled) => {
      toast.success(`Order ${cancelled.orderNumber} cancelled`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={Package}
          title="Order not found"
          description="We couldn't find an order with that ID."
          action={
            <Button asChild>
              <Link href="/orders">Back to orders</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const currency = order.currency ?? 'USD';
  const status = orderStatusStyles[order.status];
  const cancellable = CANCELLABLE.includes(order.status);

  return (
    <div className="container py-12 sm:py-16">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4" /> Back to orders
          </Link>
        </Button>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
        <Badge className={status.className}>{status.label}</Badge>
        <span className="text-sm text-muted-foreground">Placed {formatDateTime(order.createdAt)}</span>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 text-primary" /> Order progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusTimeline current={order.status} />
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-primary" /> Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {order.items.map((item, i) => (
                  <li key={`${item.product}-${i}`} className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <ProductImage src={item.image} alt={item.name} sizes="64px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                      {item.variant && <p className="text-xs text-muted-foreground">{item.variant}</p>}
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.unitPrice, currency)} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(item.total, currency)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Summary column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(order.subtotal, currency)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">{order.shippingFee > 0 ? formatCurrency(order.shippingFee, currency) : 'Free'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">{formatCurrency(order.tax, currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-semibold">Total</span>
                <span className="font-bold">{formatCurrency(order.total, currency)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping address */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" /> Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.shippingAddress.name}</p>
              <p className="text-muted-foreground">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p className="text-muted-foreground">{order.shippingAddress.addressLine2}</p>}
              <p className="text-muted-foreground">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
              <p className="text-muted-foreground">{order.shippingAddress.country}</p>
              <p className="text-muted-foreground">Phone: {order.shippingAddress.phone}</p>
              {order.trackingNumber && (
                <p className="pt-2 text-xs text-muted-foreground">Tracking: {order.trackingNumber}</p>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-primary" /> Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{paymentMethodLabels[order.paymentMethod]}</span>
              <Badge variant={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'failed' ? 'destructive' : 'secondary'}>
                {order.paymentStatus}
              </Badge>
            </CardContent>
          </Card>

          {cancellable && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => cancelMutation.mutate(order._id)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
              Cancel order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <RequireAuth>
      <OrderDetailContent />
    </RequireAuth>
  );
}