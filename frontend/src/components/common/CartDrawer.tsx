'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { QuantityStepper } from './QuantityStepper';
import { useCartStore } from '@/store/cartStore';
import { useUiStore } from '@/store/uiStore';
import { formatCurrency } from '@/lib/utils';

export function CartDrawer() {
  const open = useUiStore((s) => s.isCartOpen);
  const closeCart = useUiStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const remove = useCartStore((s) => s.remove);
  const count = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const subtotal = useCartStore((s) => s.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const currency = items[0]?.currency ?? 'USD';

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? undefined : closeCart())}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Your Cart {count > 0 && <span className="text-sm font-normal text-muted-foreground">({count})</span>}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <p className="font-medium">Your cart is empty</p>
              <Button onClick={closeCart} asChild>
                <Link href="/products">Start shopping</Link>
              </Button>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              <ul className="space-y-4">
                {items.map((item) => (
                  <motion.li
                    key={`${item.productId}-${item.variant ?? ''}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    className="flex gap-4 rounded-2xl border p-3"
                  >
                    <Link href={`/products/${item.slug}`} onClick={closeCart} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                    </Link>
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/products/${item.slug}`} onClick={closeCart} className="line-clamp-1 text-sm font-medium hover:underline">
                          {item.name}
                        </Link>
                        <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => remove(item.productId, item.variant)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                      {item.variant && <p className="text-xs text-muted-foreground">{item.variant}</p>}
                      <div className="mt-auto flex items-center justify-between">
                        <QuantityStepper value={item.quantity} onChange={(q) => updateQuantity(item.productId, q, item.variant)} max={item.stock} size="sm" />
                        <span className="text-sm font-semibold">{formatCurrency(item.price * item.quantity, currency)}</span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </AnimatePresence>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal, currency)}</span>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">Shipping &amp; taxes calculated at checkout.</p>
            <Separator className="mb-4" />
            <div className="space-y-2">
              <Button asChild className="w-full" size="lg" onClick={closeCart}>
                <Link href="/checkout">Checkout</Link>
              </Button>
              <Button asChild variant="outline" className="w-full" onClick={closeCart}>
                <Link href="/cart">View full cart</Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}