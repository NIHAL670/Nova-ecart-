'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn, formatCurrency } from '@/lib/utils';

interface OrderSummaryProps {
  currency: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  shippingEligible?: boolean;
  /** Optional coupon apply block rendered above the subtotal. */
  coupon?: ReactNode;
  /** Action area rendered below the total. */
  footer?: ReactNode;
  title?: string;
  className?: string;
}

/** Purchase breakdown used on the cart page and the checkout review step. */
export function OrderSummary({
  currency,
  subtotal,
  discount,
  shippingFee,
  tax,
  total,
  shippingEligible = true,
  coupon,
  footer,
  title = 'Order Summary',
  className,
}: OrderSummaryProps) {
  const hasDiscount = discount > 0;
  const hasShipping = shippingFee > 0;

  return (
    <Card className={cn('shadow-soft', className)}>
      <CardHeader className="pb-4">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {coupon}

        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
          </div>

          {hasDiscount && (
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span>Discount</span>
              <span>-{formatCurrency(discount, currency)}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className={shippingEligible && !hasShipping ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'font-medium'}>
              {hasShipping ? formatCurrency(shippingFee, currency) : 'Free'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium">{formatCurrency(tax, currency)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="font-semibold">Total</span>
          <span className="text-lg font-bold tracking-tight">{formatCurrency(total, currency)}</span>
        </div>

        {footer && (
          <>
            <Separator />
            <div className="space-y-2">{footer}</div>
          </>
        )}
      </CardContent>
    </Card>
  );
}