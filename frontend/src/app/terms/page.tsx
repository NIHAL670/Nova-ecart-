'use client';

import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="container py-16 sm:py-20 max-w-3xl space-y-8">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <FileText className="h-3 w-3" /> Terms of Service
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Terms & Conditions
        </h1>
        <p className="text-muted-foreground text-sm">Last Updated: August 8, 2026</p>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
          <p className="text-sm leading-relaxed">
            By accessing or using the Nova Cart storefront, you agree to comply with and be bound by these Terms of Service. Please read them carefully.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">2. Account Registration</h2>
          <p className="text-sm leading-relaxed">
            To make purchases, you must create a secure account. You are solely responsible for maintaining the confidentiality of your credentials and all activities occurring under your account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">3. Purchases and Pricing</h2>
          <p className="text-sm leading-relaxed">
            All prices are shown in USD or INR. We reserve the right to correct pricing errors or update product details at any time without prior notice. Checkout prices are authoritative.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">4. Limitation of Liability</h2>
          <p className="text-sm leading-relaxed">
            Nova Cart is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for direct, indirect, or incidental damages resulting from your use of the platform.
          </p>
        </section>
      </div>
    </div>
  );
}
