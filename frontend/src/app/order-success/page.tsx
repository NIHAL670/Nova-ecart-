'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, CreditCard, Loader2, MapPin, Package, PackageCheck, ShoppingBag } from 'lucide-react';
import { fetchOrderById } from '@/services/order.service';
import { queryKeys, orderStatusStyles, paymentMethodLabels } from '@/constants';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductImage } from '@/components/product/ProductImage';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const reference = searchParams.get('ref');

  const { data: order, isPending } = useQuery({
    queryKey: orderId ? queryKeys.order(orderId) : ['order', 'none'],
    queryFn: () => fetchOrderById(orderId ?? ''),
    enabled: Boolean(orderId),
  });

  if (isPending) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="mx-auto h-20 w-20 rounded-full" />
          <Skeleton className="mx-auto h-6 w-64" />
          <Skeleton className="mx-auto h-4 w-72" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={ShoppingBag}
          title="We couldn't find that order"
          description="The order reference may be missing or expired. Head back and try again."
          action={
            <Button asChild>
              <Link href="/orders">View my orders</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const currency = order.currency ?? 'USD';
  const status = orderStatusStyles[order.status];

  return (
    <div className="container py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        {/* Success hero */}
        <div className="flex flex-col items-center pb-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
          >
            <CheckCircle2 className="h-10 w-10" />
          </motion.div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Order confirmed!</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Thank you for your purchase. We&rsquo;ve received your order and are getting it ready. A confirmation has been sent to your email.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              Order #{order.orderNumber}
            </Badge>
            <Badge className={status.className}>Order status: {status.label}</Badge>
          </div>
          {reference && <p className="mt-2 text-xs text-muted-foreground">Payment reference: {reference}</p>}
        </div>

        <div className="space-y-6">
          {/* Items */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-primary" /> Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-4">
                {order.items.map((item, i) => (
                  <li key={`${item.product}-${i}`} className="flex items-center gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <ProductImage src={item.image} alt={item.name} sizes="56px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                      {item.variant && <p className="text-xs text-muted-foreground">{item.variant}</p>}
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-muted-foreground">
                        {formatCurrency(item.unitPrice, currency)} × {item.quantity}
                      </div>
                      <div className="font-semibold">{formatCurrency(item.total, currency)}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <Separator />

              <div className="space-y-2 text-sm">
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
              </div>
            </CardContent>
          </Card>

          {/* Delivery */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" /> Delivery details
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

          <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
            <Button asChild>
              <Link href="/products">
                <ShoppingBag className="h-4 w-4" /> Continue shopping
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/orders">
                <PackageCheck className="h-4 w-4" /> View all orders
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}