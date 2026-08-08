'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  ShoppingBag,
  Truck,
  Wallet,
} from 'lucide-react';
import { RequireAuth } from '@/components/common/RequireAuth';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';
import { AddressForm } from '@/components/checkout/AddressForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { PaymentGateway } from '@/components/checkout/PaymentGateway';
import { RazorpayCheckout } from '@/components/checkout/RazorpayCheckout';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { fetchAddresses } from '@/services/address.service';
import { validateCart, checkout } from '@/services/order.service';
import { getErrorMessage } from '@/lib/api';
import { queryKeys, paymentMethodLabels } from '@/constants';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductImage } from '@/components/product/ProductImage';
import type { Address, PaymentMethod, CheckoutResult } from '@/types';

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutFlow />
    </RequireAuth>
  );
}

function CheckoutFlow() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [paymentResult, setPaymentResult] = useState<CheckoutResult | null>(null);

  useEffect(() => setReady(true), []);

  const currency = items[0]?.currency ?? 'USD';
  const localSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemsKey = useMemo(
    () => JSON.stringify(items.map((i) => ({ productId: i.productId, quantity: i.quantity, variant: i.variant ?? null }))),
    [items],
  );

  // Empty cart → back to the cart page once hydrated on the client.
  useEffect(() => {
    if (ready && items.length === 0) router.replace('/cart');
  }, [ready, items.length, router]);

  const { data: addresses = [] } = useQuery({ queryKey: queryKeys.addresses, queryFn: fetchAddresses });
  const { data: validated, isPending: validationPending, error } = useQuery({
    queryKey: [...queryKeys.cartValidate, itemsKey, 'checkout'],
    queryFn: () => validateCart(items),
    enabled: items.length > 0,
  });

  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error));
      router.push('/cart');
    }
  }, [error, router]);

  // Preselect the default (or first) address once loaded.
  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const preferred = addresses.find((a) => a.isDefault) ?? addresses[0];
      if (preferred) setSelectedAddressId(preferred._id);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses.find((a) => a._id === selectedAddressId);

  const subtotal = validated?.subtotal ?? localSubtotal;
  const discount = validated?.discount ?? 0;
  const shippingFee = validated?.shippingFee ?? 0;
  const tax = validated?.tax ?? 0;
  const total = validated?.total ?? Math.max(0, subtotal - discount + shippingFee + tax);

  const finalizeOrder = (orderId: string, ref?: string) => {
    clear();
    router.push(`/order-success?order=${orderId}${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`);
  };

  const checkoutMutation = useMutation({
    mutationFn: checkout,
    onSuccess: (res) => {
      if (res.gateway === 'cod') {
        toast.success('Order placed successfully');
        finalizeOrder(res.order._id);
        return;
      }
      // Stripe / Razorpay need a second step to complete payment.
      setPaymentResult(res);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (!ready || items.length === 0) {
    return (
      <div className="container py-12">
        <Skeleton className="mx-auto h-6 w-48" />
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // --- Active payment gateway (after an order has been created) ---
  if (paymentResult) {
    return (
      <div className="container py-12 sm:py-16">
        <div className="mx-auto max-w-xl">
          {paymentResult.gateway === 'stripe' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" /> Complete your payment
                </CardTitle>
                <CardDescription>Enter your card details to pay securely via Stripe.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PaymentGateway
                  clientSecret={paymentResult.clientSecret}
                  onSuccess={(paymentIntentId) => finalizeOrder(paymentResult.order._id, paymentIntentId)}
                />
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" /> Payments are encrypted and processed securely.
                </div>
              </CardContent>
            </Card>
          )}
          {paymentResult.gateway === 'razorpay' && (
            <RazorpayCheckout
              orderId={paymentResult.razorpayOrderId}
              amount={paymentResult.amount}
              currency={paymentResult.currency}
              keyId={paymentResult.keyId}
              name={user?.name}
              email={user?.email}
              onSuccess={(paymentId) => finalizeOrder(paymentResult.order._id, paymentId)}
            />
          )}
        </div>
      </div>
    );
  }

  const canContinueToPayment = Boolean(selectedAddressId);

  return (
    <div className="container py-12 sm:py-16">
      <h1 className="mb-8 text-2xl font-bold tracking-tight">Checkout</h1>
      <CheckoutStepper step={step} className="mb-10" />

      <div className="grid items-start gap-8 lg:grid-cols-3">
        {/* Steps */}
        <div className="space-y-6 lg:col-span-2">
          {/* Step 1 — Address */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Shipping address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {addresses.length === 0 && !showAddressForm && (
                  <p className="text-sm text-muted-foreground">No saved addresses yet. Add one below to continue.</p>
                )}

                {addresses.length > 0 && (
                  <RadioGroup value={selectedAddressId ?? ''} onValueChange={(v) => setSelectedAddressId(v)} className="gap-3">
                    {addresses.map((addr) => (
                      <div key={addr._id}>
                        <RadioGroupItem value={addr._id} id={`addr-${addr._id}`} className="peer sr-only" />
                        <Label
                          htmlFor={`addr-${addr._id}`}
                          className={cn(
                            'flex cursor-pointer flex-col gap-1 rounded-2xl border p-4 transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/30',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm font-semibold capitalize">
                              <Building2 className="h-4 w-4 text-muted-foreground" /> {addr.name}
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                {addr.label}
                              </span>
                            </span>
                            {addr.isDefault && <span className="text-xs font-medium text-primary">Default</span>}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {addr.addressLine1}
                            {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                          </span>
                          <span className="text-sm text-muted-foreground">Phone: {addr.phone}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {showAddressForm ? (
                  <div className="rounded-2xl border border-dashed p-5">
                    <AddressForm
                      onCreated={(addr) => {
                        setSelectedAddressId(addr._id);
                        setShowAddressForm(false);
                      }}
                    />
                  </div>
                ) : (
                  <Button type="button" variant="outline" onClick={() => setShowAddressForm(true)}>
                    + Add new address
                  </Button>
                )}

                <div className="flex justify-end border-t pt-5">
                  <Button onClick={() => setStep(2)} disabled={!canContinueToPayment}>
                    Continue to payment <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2 — Payment method */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" /> Payment method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="gap-3">
                  {(['stripe', 'razorpay', 'cod'] as PaymentMethod[]).map((method) => (
                    <div key={method}>
                      <RadioGroupItem value={method} id={`pm-${method}`} className="peer sr-only" />
                      <Label
                        htmlFor={`pm-${method}`}
                        className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/30"
                      >
                        {method === 'stripe' && <CreditCard className="h-5 w-5 text-muted-foreground" />}
                        {method === 'razorpay' && <Lock className="h-5 w-5 text-muted-foreground" />}
                        {method === 'cod' && <Truck className="h-5 w-5 text-muted-foreground" />}
                        <span className="text-sm font-medium">{paymentMethodLabels[method]}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex justify-between border-t pt-5">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button onClick={() => setStep(3)}>
                    Review order <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3 — Review + place order */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" /> Review your order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Items */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Items ({items.length})</h3>
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li key={`${item.productId}-${item.variant ?? ''}`} className="flex items-center gap-4">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                          <ProductImage src={item.image} alt={item.name} sizes="56px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                          {item.variant && <p className="text-xs text-muted-foreground">{item.variant}</p>}
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">× {item.quantity}</div>
                          <div className="text-muted-foreground">{formatCurrency(item.price * item.quantity, currency)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Shipping address */}
                {selectedAddress && (
                  <div className="flex items-start gap-3 rounded-2xl border p-4">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="text-sm">
                      <p className="font-medium">{selectedAddress.name}</p>
                      <p className="text-muted-foreground">
                        {selectedAddress.addressLine1}
                        {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ''}
                      </p>
                      <p className="text-muted-foreground">
                        {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}, {selectedAddress.country}
                      </p>
                      <p className="text-muted-foreground">Phone: {selectedAddress.phone}</p>
                    </div>
                  </div>
                )}

                {/* Payment method */}
                <div className="flex items-center justify-between rounded-2xl border p-4 text-sm">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span className="font-medium">{paymentMethodLabels[paymentMethod]}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                    Change
                  </Button>
                </div>

                <div className="flex justify-between border-t pt-5">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    onClick={() => checkoutMutation.mutate({ items, shippingAddressId: selectedAddressId ?? '', paymentMethod })}
                    disabled={checkoutMutation.isPending}
                    className="min-w-44"
                  >
                    {checkoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    {checkoutMutation.isPending ? 'Placing order…' : 'Place order'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sticky summary */}
        <div className="space-y-4 lg:sticky lg:top-24">
          <OrderSummary
            title="Cart summary"
            currency={currency}
            subtotal={subtotal}
            discount={discount}
            shippingFee={shippingFee}
            tax={tax}
            total={total}
            shippingEligible={Boolean(validated?.shippingEligible)}
          />
          {validationPending && <Skeleton className="h-40" />}
          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShoppingBag className="h-3.5 w-3.5" /> {items.reduce((n, i) => n + i.quantity, 0)} item(s) in your cart
          </p>
        </div>
      </div>
    </div>
  );
}