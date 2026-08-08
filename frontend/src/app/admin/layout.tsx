'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BadgePercent,
  BarChart3,
  Boxes,
  FolderTree,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingCart,
  Store,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RequireAuth } from '@/components/common/RequireAuth';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/users', label: 'Customers', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: BadgePercent },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`));
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <div className="px-6 py-5">
        <Logo href="/admin" />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4">
        <Button asChild variant="outline" className="w-full">
          <Link href="/">
            <Store className="h-4 w-4" /> View storefront
          </Link>
        </Button>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const current = NAV_ITEMS.find((i) => isActivePath(pathname, i.href));

  return (
    <RequireAuth admin>
      <div className="min-h-screen bg-muted/30">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card lg:flex">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
            <SheetHeader className="px-0 py-0">
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            </SheetHeader>
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="lg:pl-64">
          {/* Top bar */}
          <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-display text-base font-semibold sm:text-lg">
                  {current?.label ?? 'Admin'}
                </h1>
                <p className="hidden text-xs text-muted-foreground sm:block">Nova Cart admin console</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}