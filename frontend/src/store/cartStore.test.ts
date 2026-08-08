import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore, selectCartCount, selectCartSubtotal } from './cartStore';
import type { Product } from '@/types';

const product: Product = {
  _id: 'p1',
  name: 'Headphones',
  slug: 'headphones',
  description: 'x',
  category: 'c1',
  tags: [],
  images: [{ url: 'https://picsum.photos/seed/x/600/600' }],
  price: 100,
  currency: 'USD',
  stock: 10,
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: false,
  onSale: false,
  status: 'active',
  rating: 4.5,
  reviewCount: 2,
  soldCount: 5,
  variants: [],
  effectivePrice: 100,
  discountPercent: 0,
};

describe('cart store', () => {
  beforeEach(() => useCartStore.setState({ items: [] }));

  it('adds a new item', () => {
    useCartStore.getState().add(product);
    expect(selectCartCount(useCartStore.getState())).toBe(1);
    expect(selectCartSubtotal(useCartStore.getState())).toBe(100);
  });

  it('merges quantity when the same product is added again', () => {
    useCartStore.getState().add(product);
    useCartStore.getState().add(product, 2);
    const state = useCartStore.getState();
    expect(state.items[0].quantity).toBe(3);
    expect(selectCartCount(state)).toBe(3);
  });

  it('caps quantity at stock', () => {
    useCartStore.getState().add(product, 99);
    expect(useCartStore.getState().items[0].quantity).toBe(10);
  });

  it('removes an item', () => {
    useCartStore.getState().add(product);
    useCartStore.getState().remove('p1');
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('updates quantity within bounds', () => {
    useCartStore.getState().add(product);
    useCartStore.getState().updateQuantity('p1', 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
    useCartStore.getState().updateQuantity('p1', 999);
    expect(useCartStore.getState().items[0].quantity).toBe(10);
    useCartStore.getState().updateQuantity('p1', 0);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });
});