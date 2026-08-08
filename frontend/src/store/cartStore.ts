import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';
import { storageKeys } from '@/constants';

interface CartState {
  items: CartItem[];
  add: (product: Product, quantity?: number) => void;
  remove: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
  clear: () => void;
  setItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      add: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === product._id && !i.variant);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product._id ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) } : i,
              ),
            };
          }
          const item: CartItem = {
            productId: product._id,
            quantity: Math.min(quantity, product.stock || 1),
            name: product.name,
            slug: product.slug,
            image: product.images[0]?.url ?? '',
            price: product.effectivePrice ?? product.price,
            currency: product.currency ?? 'USD',
            stock: product.stock,
          };
          return { items: [...state.items, item] };
        }),

      remove: (productId, variant) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId || (variant && i.variant !== variant)),
        })),

      updateQuantity: (productId, quantity, variant) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && (!variant || i.variant === variant)
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) }
              : i,
          ),
        })),

      clear: () => set({ items: [] }),
      setItems: (items) => set({ items }),
    }),
    {
      name: storageKeys.cart,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

export const selectCartCount = (s: CartState) => s.items.reduce((sum, i) => sum + i.quantity, 0);
export const selectCartSubtotal = (s: CartState) => s.items.reduce((sum, i) => sum + i.price * i.quantity, 0);