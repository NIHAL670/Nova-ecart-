'use client';

import { Truck, RotateCcw } from 'lucide-react';

export default function ShippingReturnsPage() {
  return (
    <div className="container py-16 sm:py-20 max-w-3xl space-y-12">
      <div className="space-y-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Truck className="h-3 w-3" /> Support
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Shipping & Returns Policy
        </h1>
        <p className="mx-auto max-w-xl text-base text-muted-foreground">
          Everything you need to know about deliveries, returns, and exchanges.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 pt-6">
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-lg font-bold text-foreground">
            <Truck className="h-5 w-5 text-primary" /> Shipping Info
          </div>
          <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <li><strong>Standard Shipping:</strong> Free for orders over $100, otherwise $8. Deliveries take 3-5 business days.</li>
            <li><strong>Express Delivery:</strong> Available at checkout for a flat $15. Deliveries take 1-2 business days.</li>
            <li><strong>Tracking:</strong> A tracking number is sent to your email immediately upon dispatch. You can also monitor shipping status directly in your order history.</li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-lg font-bold text-foreground">
            <RotateCcw className="h-5 w-5 text-primary" /> Return Policy
          </div>
          <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <li><strong>30-Day Window:</strong> You can return any item within 30 days of purchase for a full refund or exchange.</li>
            <li><strong>Eligibility:</strong> Items must be in their original packaging, unused, and undamaged.</li>
            <li><strong>Easy Return Process:</strong> Contact support or initiate a return from your profile. We will email you a prepaid shipping label.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
