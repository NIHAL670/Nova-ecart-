'use client';

import { useEffect, useRef, useState } from 'react';
import { loadStripe, type Stripe, type StripeCardElement } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaymentGatewayProps {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  className?: string;
}

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

/** Stripe card form — mounts a raw Stripe.js card element and confirms the PaymentIntent. */
export function PaymentGateway({ clientSecret, onSuccess, className }: PaymentGatewayProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<StripeCardElement | null>(null);
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const stripe = await getStripe();
      if (!stripe) {
        if (mounted) setError('Stripe could not be loaded. Please try another payment method.');
        return;
      }
      if (!mounted || !mountRef.current) return;
      const elements = stripe.elements();
      const card = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#1f2937',
            fontFamily: 'inherit',
            '::placeholder': { color: '#9ca3af' },
          },
        },
      });
      cardRef.current = card;
      card.mount(mountRef.current);
      card.on('change', (event) => {
        setError(event.error?.message ?? null);
        setReady(event.complete);
      });
    })();
    return () => {
      mounted = false;
      cardRef.current?.destroy();
      cardRef.current = null;
    };
  }, []);

  const handlePay = async () => {
    const stripe = await getStripe();
    if (!stripe || !cardRef.current || processing) return;
    setProcessing(true);
    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardRef.current },
      });
      if (confirmError) {
        setError(confirmError.message ?? 'Payment failed');
        toast.error(confirmError.message ?? 'Payment failed');
        return;
      }
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-xl border bg-background p-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
        <div ref={mountRef} className="min-h-[3rem]" />
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      <Button className="w-full" size="lg" disabled={!ready || processing} onClick={handlePay}>
        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {processing ? 'Processing payment…' : `Pay securely`}
      </Button>
    </div>
  );
}