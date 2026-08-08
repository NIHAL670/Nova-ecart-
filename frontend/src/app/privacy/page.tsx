'use client';

import { ShieldAlert } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="container py-16 sm:py-20 max-w-3xl space-y-8">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <ShieldAlert className="h-3 w-3" /> Privacy Policy
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Your Privacy Matters
        </h1>
        <p className="text-muted-foreground text-sm">Last Updated: August 8, 2026</p>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">1. Information We Collect</h2>
          <p className="text-sm leading-relaxed">
            We collect information you provide directly to us when creating an account, placing an order, or communicating with us. This includes your name, email address, billing/shipping addresses, phone number, and payment choices.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">2. How We Use Your Data</h2>
          <p className="text-sm leading-relaxed">
            We use the information we collect to fulfill your orders, process payments, send order updates/tracking details, and personalize your overall shopping experience.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">3. Sharing of Information</h2>
          <p className="text-sm leading-relaxed">
            We do not sell or lease your personal information to third parties. We share data only with trusted partners (such as payment gateways like Stripe/Razorpay, and courier services) strictly to process transactions and deliver shipments.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">4. Cookies and Tracking</h2>
          <p className="text-sm leading-relaxed">
            We use secure cookies and browser local storage to preserve your authentication state, wishlist preferences, and shopping cart items across visits.
          </p>
        </section>
      </div>
    </div>
  );
}
