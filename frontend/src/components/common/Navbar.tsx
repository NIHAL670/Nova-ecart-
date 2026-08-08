'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingBag, Heart, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Shop' },
  { href: '/products?sort=-discountPercent', label: 'Deals' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const wishCount = useWishlistStore((s) => s.ids.length);
  const openSearch = useUiStore((s) => s.openSearch);
  const openCart = useUiStore((s) => s.openCart);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href.split('?')[0]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl">
      <nav className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button className="lg:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Logo />
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    'relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:text-primary',
                    isActive(l.href) ? 'text-primary' : 'text-foreground/70',
                  )}
                >
                  {l.label}
                  {isActive(l.href) && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-primary/10" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={openSearch} className="hidden items-center gap-2 rounded-full border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent md:flex">
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Search…</span>
            <kbd className="hidden rounded bg-muted px-1 text-[10px] lg:inline">⌘K</kbd>
          </button>
          <button className="rounded-full p-2 hover:bg-accent md:hidden" onClick={openSearch} aria-label="Search">
            <Search className="h-5 w-5" />
          </button>

          <ThemeToggle />

          <Link href="/wishlist" className="relative hidden rounded-full p-2 hover:bg-accent sm:inline-flex" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
            {wishCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {wishCount}
              </span>
            )}
          </Link>

          <button onClick={openCart} className="relative rounded-full p-2 hover:bg-accent" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
              >
                {cartCount}
              </motion.span>
            )}
          </button>

          <UserMenu />
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-background lg:hidden">
          <ul className="container space-y-1 py-3">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-accent">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-accent">
                Wishlist ({wishCount})
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}