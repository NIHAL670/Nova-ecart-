'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature?: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name?: string;
  prefill?: { name?: string; email?: string };
  handler?: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}

type RazorpayConstructor = new (options: RazorpayOptions) => { open: () => void };

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

interface RazorpayCheckoutProps {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  name?: string;
  email?: string;
  onSuccess: (paymentId: string) => void;
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    if (document.querySelector('script[data-razorpay-checkout]')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.setAttribute('data-razorpay-checkout', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the Razorpay payment gateway.'));
    document.body.appendChild(script);
  });
}

/** Opens the Razorpay checkout dialog for the supplied order. */
export function RazorpayCheckout({ orderId, amount, currency, keyId, name, email, onSuccess }: RazorpayCheckoutProps) {
  const openedRef = useRef(false);

  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;

    void (async () => {
      try {
        await loadScript();
        if (!window.Razorpay) throw new Error('Razorpay failed to initialise.');
        const rzp = new window.Razorpay({
          key: keyId,
          amount: amount * 100,
          currency,
          order_id: orderId,
          name: name ?? 'Nova Cart',
          prefill: { name, email },
          handler: (response) => onSuccess(response.razorpay_payment_id),
          modal: { ondismiss: () => toast.info('Payment cancelled') },
        });
        rzp.open();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Payment failed to start.';
        toast.error(msg);
      }
    })();

    return () => {
      // The dialog is opened once; unmounting cancels the checkout popup.
    };
  }, [amount, currency, email, keyId, name, onSuccess, orderId]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Opening Razorpay checkout&hellip;</p>
    </div>
  );
}