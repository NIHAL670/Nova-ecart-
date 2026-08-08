'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShoppingBag, Truck, Trash2, Tag, X, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { validateCart } from '@/services/order.service';
import { validateCoupon } from '@/services/coupon.service';
import { getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/constants';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ProductImage } from '@/components/product/ProductImage';
import { QuantityStepper } from '@/components/common/QuantityStepper';
import { EmptyState } from '@/components/common/EmptyState';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const FREE_SHIPPING_THRESHOLD = 100;

export default function CartPage() {
  const queryClient = useQueryClient();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const localSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const currency = items[0]?.currency ?? 'USD';

  const [couponInput, setCouponInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);

  const itemsKey = JSON.stringify(items.map((i) => ({ productId: i.productId, quantity: i.quantity, variant: i.variant ?? null })));

  const { data: validated, isRefetching, error } = useQuery({
    queryKey: [...queryKeys.cartValidate, itemsKey, appliedCouponCode ?? ''],
    queryFn: () => validateCart(items, appliedCouponCode ?? undefined),
    enabled: items.length > 0,
  });

  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error));
    }
  }, [error]);

  // Authoritative server totals, falling back to local sums while pending/empty.
  const subtotal = validated?.subtotal ?? localSubtotal;
  const discount = validated?.discount ?? 0;
  const shippingFee = validated?.shippingFee ?? 0;
  const tax = validated?.tax ?? 0;
  const total = validated?.total ?? Math.max(0, subtotal - discount + shippingFee + tax);
  const shippingEligible = Boolean(validated?.shippingEligible);

  const couponMutation = useMutation({
    mutationFn: (code: string) => validateCoupon(code, subtotal),
    onSuccess: (res) => {
      setAppliedCouponCode(res.code);
      toast.success(`Coupon "${res.code}" applied`);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleAppCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    couponMutation.mutate(code);
  };

  const removeCoupon = () => {
    setAppliedCouponCode(null);
    setCouponInput('');
    void queryClient.invalidateQueries({ queryKey: queryKeys.cartValidate });
  };

  if (items.length === 0) {
    return (
      <div className="container py-16 sm:py-20">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Your Cart</h1>
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Browse the catalogue to find something you love."
          action={
            <Button asChild>
              <Link href="/products">Start shopping</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container py-12 sm:py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Your Cart{' '}
          <span className="text-base font-normal text-muted-foreground">
            ({items.reduce((n, i) => n + i.quantity, 0)} items)
          </span>
        </h1>
        <Button variant="ghost" size="sm" onClick={() => clear()} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="mr-1.5 h-4 w-4" /> Clear Cart
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items list */}
        <div className="lg:col-span-2">
          <ul className="space-y-4">
            {items.map((item) => {
              const lineTotal = item.price * item.quantity;
              return (
                <li key={`${item.productId}-${item.variant ?? ''}`} className="flex flex-wrap gap-4 rounded-2xl border p-4 sm:flex-nowrap">
                  <Link href={`/products/${item.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                    <ProductImage src={item.image} alt={item.name} sizes="96px" />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/products/${item.slug}`} className="line-clamp-1 font-medium hover:underline">
                          {item.name}
                        </Link>
                        {item.variant && <div className="mt-1"><Badge variant="secondary">{item.variant}</Badge></div>}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Remove item">
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove this item?</AlertDialogTitle>
                            <AlertDialogDescription>
                              &ldquo;{item.name}&rdquo;{item.variant ? ` (${item.variant})` : ''} will be removed from your cart.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => remove(item.productId, item.variant)}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                      <QuantityStepper value={item.quantity} onChange={(q) => updateQuantity(item.productId, q, item.variant)} max={item.stock} />
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatCurrency(lineTotal, currency)}</div>
                        <div className="text-xs text-muted-foreground">{formatCurrency(item.price, currency)} each</div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex items-center justify-between">
            <Button asChild variant="outline">
              <Link href="/products">Continue shopping</Link>
            </Button>
          </div>
        </div>

        {/* Order summary */}
        <div className="space-y-6">
          {/* Free shipping progress */}
          <div className="rounded-2xl border p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Truck className="h-4 w-4 text-primary" />
              {subtotal >= FREE_SHIPPING_THRESHOLD ? 'You have unlocked free shipping!' : `Free shipping on orders over ${formatCurrency(FREE_SHIPPING_THRESHOLD, currency)}`}
            </div>
            {subtotal < FREE_SHIPPING_THRESHOLD && (
              <>
                <Progress value={(Math.min(subtotal, FREE_SHIPPING_THRESHOLD) / FREE_SHIPPING_THRESHOLD) * 100} className="my-3" />
                <p className="text-xs text-muted-foreground">
                  You&rsquo;re {formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal, currency)} away from free shipping.
                </p>
              </>
            )}
          </div>

          <OrderSummary
            currency={currency}
            subtotal={subtotal}
            discount={discount}
            shippingFee={shippingFee}
            tax={tax}
            total={total}
            shippingEligible={shippingEligible}
            coupon={
              <div className="space-y-2.5">
                {appliedCouponCode ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                    <span className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      <Tag className="h-4 w-4" /> {appliedCouponCode}
                    </span>
                    <Button variant="ghost" size="icon-sm" onClick={removeCoupon} aria-label="Remove coupon">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleAppCoupon} className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Discount code"
                      className="h-10"
                    />
                    <Button type="submit" variant="secondary" disabled={couponMutation.isPending} className="shrink-0">
                      {couponMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </form>
                )}
              </div>
            }
            footer={
              <>
                <Button asChild size="lg" className="w-full">
                  <Link href="/checkout">Proceed to checkout</Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground">Taxes and shipping calculated at checkout.</p>
              </>
            }
          />

          {isRefetching && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Updating totals&hellip;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}