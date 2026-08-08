import { get, post, del } from '@/lib/api';
import { api } from '@/constants';
import type { Product } from '@/types';

export async function fetchWishlist(): Promise<Product[]> {
  return get<Product[]>(api.wishlist.get);
}

export async function toggleWishlist(productId: string): Promise<{ added: boolean; items: Product[] }> {
  return post<{ added: boolean; items: Product[] }>(api.wishlist.toggle, { productId });
}

export async function removeFromWishlist(productId: string): Promise<Product[]> {
  return del<Product[]>(api.wishlist.remove(productId));
}

export async function checkWishlisted(productId: string): Promise<{ isWishlisted: boolean }> {
  return get<{ isWishlisted: boolean }>(api.wishlist.check(productId));
}