'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, Award, ShieldCheck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container py-16 sm:py-20 max-w-4xl space-y-12">
      <div className="space-y-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> About Nova Cart
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Redefining Modern E-Commerce
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Nova Cart is built to provide a curated catalog of premium items with blazing-fast checkout, secure transactions, and a beautiful user interface.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3 pt-6">
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <Users className="h-8 w-8 text-primary" />
          <h3 className="font-semibold text-lg">Customer First</h3>
          <p className="text-sm text-muted-foreground">We prioritize your experience from browsing to post-purchase support.</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <Award className="h-8 w-8 text-primary" />
          <h3 className="font-semibold text-lg">Curated Quality</h3>
          <p className="text-sm text-muted-foreground">Every item is rigorously tested and handpicked for premium quality.</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h3 className="font-semibold text-lg">Secure Shopping</h3>
          <p className="text-sm text-muted-foreground">Your data is fully encrypted with secure Stripe, Razorpay, or COD checkout.</p>
        </div>
      </div>

      <div className="rounded-3xl border bg-gradient-to-br from-muted/50 to-muted p-8 sm:p-10 space-y-6">
        <h2 className="font-display text-2xl font-bold">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed">
          At Nova Cart, we believe that online shopping should be seamless, delightful, and fast. We work directly with top manufacturers to eliminate middlemen markup and deliver superior quality items directly to your doorstep.
        </p>
        <div className="flex gap-4 pt-2">
          <Button asChild>
            <Link href="/products">Shop Catalogue</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contact">Get in Touch</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
