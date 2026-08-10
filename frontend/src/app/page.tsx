'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowRight,
  BadgePercent,
  Clock,
  Flame,
  Headset,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Truck,
  Zap,
} from 'lucide-react';
import {
  fetchBestSellers,
  fetchCategoryTree,
  fetchFeatured,
  fetchOffers,
  fetchProducts,
  fetchTrending,
} from '@/services/catalog.service';
import type { Product } from '@/types';
import { queryKeys } from '@/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeading } from '@/components/common/SectionHeading';
import { ProductsCarousel } from '@/components/product/ProductsCarousel';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductGridSkeleton } from '@/components/product/ProductSkeleton';
import { useInView } from '@/hooks/useInView';
import { useCountdown, endOfDay } from '@/hooks/useCountdown';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Mounts children (and their data queries) only once scrolled into view. */
function LazySection({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, inView } = useInView('-120px');
  return (
    <div ref={ref} className={cn('min-h-[120px]', className)}>
      {inView ? children : null}
    </div>
  );
}

/** Animated count-up that fires once when scrolled into view. */
function CountUp({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const { ref, inView } = useInView<HTMLSpanElement>('-40px');
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const duration = 1200;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setDisplay(value * (1 - Math.pow(1 - p, 3))); // easeOutCubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {Number(display.toFixed(decimals)).toLocaleString()}
      {suffix}
    </span>
  );
}

function TimeBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-[42px] sm:min-w-[52px] flex-col items-center rounded-xl border bg-card/80 px-1 py-1 sm:px-2 sm:py-1.5 backdrop-blur">
      <span className="font-display text-base sm:text-lg font-bold tabular-nums leading-none">{value}</span>
      <span className="mt-0.5 sm:mt-1 text-[8px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}

/** HH:MM:SS live countdown — compact chip or full time boxes. */
function CountdownDisplay({ target, compact = false }: { target: Date; compact?: boolean }) {
  const cd = useCountdown(target);
  const h = String(cd.hours).padStart(2, '0');
  const m = String(cd.minutes).padStart(2, '0');
  const s = String(cd.seconds).padStart(2, '0');

  if (compact) {
    return (
      <span className="font-display text-sm font-bold tabular-nums">
        {h}:{m}:{s}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <TimeBox value={h} label="hrs" />
      <span className="text-lg font-bold text-muted-foreground">:</span>
      <TimeBox value={m} label="min" />
      <span className="text-lg font-bold text-muted-foreground">:</span>
      <TimeBox value={s} label="sec" />
    </div>
  );
}

const trustBar = [
  'Nova Audio',
  'Pixel & Co',
  'Lumen Home',
  'Vertex Gear',
  'Crafted Labs',
  'Aurora Beauty',
  'Terra Goods',
  'Mono Wear',
];

const CATEGORY_BAR_ITEMS = [
  { name: 'Mobiles', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120&auto=format&fit=crop&q=80', href: '/products?category=Smartphones' },
  { name: 'Fashion', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=120&auto=format&fit=crop&q=80', href: '/products?category=Fashion' },
  { name: 'Electronics', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&auto=format&fit=crop&q=80', href: '/products?category=Electronics' },
  { name: 'Furniture', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=120&auto=format&fit=crop&q=80', href: '/products?category=Home+%26+Living' },
  { name: 'Appliances', image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=120&auto=format&fit=crop&q=80', href: '/products?category=Kitchen' },
  { name: 'Beauty & Care', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=120&auto=format&fit=crop&q=80', href: '/products?category=Beauty+%26+Care' },
  { name: 'Fitness & Sports', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80', href: '/products?category=Sports+%26+Outdoors' },
];

function CategoryNavBar() {
  return (
    <div className="border-b bg-background shadow-sm">
      <div className="container flex items-center justify-between gap-4 overflow-x-auto py-4 scrollbar-none md:justify-center md:gap-12">
        {CATEGORY_BAR_ITEMS.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex shrink-0 flex-col items-center gap-1.5 transition-transform hover:scale-105"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-full border bg-muted shadow-sm md:h-24 md:w-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
            </div>
            <span className="text-xs font-semibold text-foreground md:text-sm">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

const PROMO_SLIDES = [
  {
    title: 'Mega Electronics Carnival',
    subtitle: 'Laptops, Headphones & Wearables',
    offer: 'Up to 60% OFF',
    image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1000&auto=format&fit=crop&q=80',
    gradient: 'from-blue-600 via-indigo-700 to-indigo-900',
    href: '/products?category=Electronics',
  },
  {
    title: 'The Great Fashion Festival',
    subtitle: 'Latest Trends in Footwear & Apparel',
    offer: 'Min 50% OFF',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&auto=format&fit=crop&q=80',
    gradient: 'from-rose-500 via-red-600 to-amber-600',
    href: '/products?category=Fashion',
  },
  {
    title: 'Home Makeover Days',
    subtitle: 'Furniture, Kitchenware & Decor',
    offer: 'Up to 70% OFF',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1000&auto=format&fit=crop&q=80',
    gradient: 'from-emerald-600 via-teal-700 to-teal-900',
    href: '/products?category=Home+%26+Living',
  },
];

function PromoCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden bg-muted md:h-[320px] h-[220px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            'absolute inset-0 flex items-center bg-gradient-to-r text-white p-6 md:p-12',
            PROMO_SLIDES[current].gradient
          )}
        >
          <div className="container grid items-center gap-6 md:grid-cols-2">
            <div className="space-y-2 md:space-y-4">
              <motion.span
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="inline-block rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black"
              >
                {PROMO_SLIDES[current].offer}
              </motion.span>
              <motion.h2
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="font-display text-2xl font-black tracking-tight sm:text-4xl"
              >
                {PROMO_SLIDES[current].title}
              </motion.h2>
              <motion.p
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-xs text-white/90 sm:text-sm font-medium"
              >
                {PROMO_SLIDES[current].subtitle}
              </motion.p>
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pt-2"
              >
                <Button asChild className="rounded-full bg-yellow-400 text-black hover:bg-yellow-300 font-bold px-6">
                  <Link href={PROMO_SLIDES[current].href}>Shop Now</Link>
                </Button>
              </motion.div>
            </div>
            <div className="relative hidden h-full w-full md:block">
              <div className="absolute inset-y-0 right-0 w-3/4 overflow-hidden rounded-2xl shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PROMO_SLIDES[current].image}
                  alt={PROMO_SLIDES[current].title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 z-10">
        {PROMO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              'h-2 w-2 rounded-full transition-all',
              i === current ? 'bg-yellow-400 w-4' : 'bg-white/50'
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function TrustBar() {
  return (
    <section className="overflow-hidden border-b bg-background py-6 shadow-sm">
      <div className="relative">
        <div className="flex w-max animate-marquee gap-x-16 pr-16">
          {[...trustBar, ...trustBar].map((name, i) => (
            <span
              key={`${name}-${i}`}
              aria-hidden={i >= trustBar.length}
              className="whitespace-nowrap text-sm font-semibold uppercase tracking-widest text-muted-foreground/70"
            >
              {name}
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
      </div>
    </section>
  );
}

function FeaturedSection() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.families.featured,
    queryFn: () => fetchFeatured(12),
  });

  if (isLoading) {
    return (
      <section className="bg-card rounded-xl border p-5 shadow-soft mb-6">
        <ProductGridSkeleton count={5} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" />
      </section>
    );
  }
  if (!data || data.length === 0) return null;

  return (
    <section className="bg-card rounded-xl border p-5 shadow-soft mb-6">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground md:text-xl">Featured Selection</h2>
          <p className="text-xs text-muted-foreground">Handpicked items curated just for you</p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full font-bold border-primary text-primary hover:bg-primary/5">
          <Link href="/products">View All</Link>
        </Button>
      </div>
      <ProductsCarousel products={data} />
    </section>
  );
}

function TrendingSection() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.families.trending,
    queryFn: () => fetchTrending(10),
  });

  if (isLoading || !data || data.length === 0) return null;

  return (
    <section className="bg-card rounded-xl border p-5 shadow-soft mb-6">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground md:text-xl">Trending Products</h2>
          <p className="text-xs text-muted-foreground">The most popular items right now</p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full font-bold border-primary text-primary hover:bg-primary/5">
          <Link href="/products?sort=best-selling">View All</Link>
        </Button>
      </div>
      <ProductsCarousel products={data} />
    </section>
  );
}

function BestSellersSection() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.families.bestSellers,
    queryFn: () => fetchBestSellers(10),
  });

  if (isLoading || !data || data.length === 0) return null;

  return (
    <section className="bg-card rounded-xl border p-5 shadow-soft mb-6">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground md:text-xl">Best Sellers</h2>
          <p className="text-xs text-muted-foreground">Proven customer favorites</p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full font-bold border-primary text-primary hover:bg-primary/5">
          <Link href="/products?sort=best-selling">View All</Link>
        </Button>
      </div>
      <ProductsCarousel products={data} />
    </section>
  );
}

function OffersSection() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.families.offers,
    queryFn: () => fetchOffers(12),
  });
  const [target] = useState(() => endOfDay());

  if (isLoading || !data || data.length === 0) return null;

  return (
    <section className="bg-card rounded-xl border p-5 shadow-soft mb-6">
      <div className="mb-6 flex flex-col justify-between border-b pb-4 sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground md:text-xl">Deals of the Day</h2>
          <p className="text-xs text-muted-foreground">Unbeatable limited-time price drops</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-primary" /> Ends in:
          </span>
          <CountdownDisplay target={target} />
          <Button asChild variant="outline" size="sm" className="rounded-full font-bold border-primary text-primary hover:bg-primary/5 ml-0 sm:ml-2">
            <Link href="/products?sort=-discountPercent">View All</Link>
          </Button>
        </div>
      </div>
      <ProductGrid products={data} columns={4} />
    </section>
  );
}

function RecentlyViewedSection() {
  const items = useRecentlyViewedStore((s) => s.items);
  if (items.length === 0) return null;

  return (
    <section className="bg-card rounded-xl border p-5 shadow-soft mb-6">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground md:text-xl">Recently Viewed</h2>
          <p className="text-xs text-muted-foreground">Pick up where you left off</p>
        </div>
      </div>
      <ProductsCarousel products={items} />
    </section>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState('');

  const subscribe = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Please enter a valid email address');
      return;
    }
    toast.success('You are subscribed! Watch your inbox for offers.');
    setEmail('');
  };

  return (
    <section className="py-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-violet-600 to-fuchsia-600 px-6 py-14 text-center shadow-glow sm:px-12">
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <Sparkles className="mx-auto mb-4 h-8 w-8 text-white/80" />
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Get 10% off your first order</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/80">
          Join the newsletter for early access to drops, members-only deals and style notes. No spam, ever.
        </p>
        <form onSubmit={subscribe} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 border-transparent bg-white/95 pl-11"
              aria-label="Email address"
            />
          </div>
          <Button type="submit" size="lg" className="bg-background text-foreground hover:bg-background/90">
            Subscribe
          </Button>
        </form>
        <p className="mt-3 text-xs text-white/60">By subscribing you agree to our terms and privacy policy.</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <div className="bg-[#f1f3f6] pb-16 min-h-screen">
      <CategoryNavBar />
      <PromoCarousel />
      <TrustBar />

      <div className="container mt-6">
        <FeaturedSection />
        <TrendingSection />
        <BestSellersSection />
        <OffersSection />
        <RecentlyViewedSection />
        <NewsletterSection />
      </div>
    </div>
  );
}
