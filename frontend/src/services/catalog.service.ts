import { get, getWithMeta } from '@/lib/api';
import { api } from '@/constants';
import type { Product, Category, PaginationMeta } from '@/types';

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  isFeatured?: boolean;
  inStock?: boolean;
}

export async function fetchProducts(params: ProductQuery): Promise<{ items: Product[]; meta: PaginationMeta }> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== false) query.set(k, String(v));
  });
  const qs = query.toString() ? `?${query.toString()}` : '';
  const { data, meta } = await getWithMeta<Product[]>(`${api.products.list}${qs}`);
  return {
    items: data,
    meta: meta as PaginationMeta,
  };
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  return get<Product>(api.products.slug(slug));
}

export async function fetchProductById(id: string): Promise<Product> {
  return get<Product>(api.products.byId(id));
}

export async function fetchRelated(id: string): Promise<Product[]> {
  return get<Product[]>(api.products.related(id));
}

export async function fetchFeatured(limit = 12): Promise<Product[]> {
  return get<Product[]>(`${api.products.featured}?limit=${limit}`);
}
export async function fetchBestSellers(limit = 12): Promise<Product[]> {
  return get<Product[]>(`${api.products.bestSellers}?limit=${limit}`);
}
export async function fetchLatest(limit = 12): Promise<Product[]> {
  return get<Product[]>(`${api.products.latest}?limit=${limit}`);
}
export async function fetchOffers(limit = 12): Promise<Product[]> {
  return get<Product[]>(`${api.products.offers}?limit=${limit}`);
}
export async function fetchTrending(limit = 12): Promise<Product[]> {
  return get<Product[]>(`${api.products.trending}?limit=${limit}`);
}
export async function fetchSuggestions(q: string): Promise<string[]> {
  return get<string[]>(`${api.products.suggestions}?q=${encodeURIComponent(q)}`);
}

export async function fetchCategories(): Promise<Category[]> {
  return get<Category[]>(api.categories.list);
}
export async function fetchCategoryTree(): Promise<Category[]> {
  return get<Category[]>(api.categories.tree);
}