import { get, post, patch, del, client } from '@/lib/api';
import { api } from '@/constants';
import type { Review, PaginationMeta } from '@/types';

export interface ReviewListResult {
  items: Review[];
  meta: PaginationMeta;
  avgRating: number;
  count: number;
  distribution: { rating: number; count: number }[];
}

interface ReviewEnvelope {
  data: Review[];
  meta: PaginationMeta & { avgRating: number; count: number; distribution: { rating: number; count: number }[] };
}

export async function fetchReviews(productId: string, page = 1, sort = 'newest'): Promise<ReviewListResult> {
  const res = await client.get(`${api.reviews.list}?product=${productId}&page=${page}&sort=${sort}`);
  const env = res.data as ReviewEnvelope;
  const { avgRating, count, distribution, ...meta } = env.meta;
  return { items: env.data, meta, avgRating, count, distribution };
}

export async function createReview(input: { product: string; rating: number; title?: string; comment: string; images?: string[] }) {
  return post<Review>(api.reviews.create, input);
}

export async function updateReview(id: string, input: Partial<{ rating: number; title: string; comment: string }>) {
  return patch<Review>(api.reviews.update(id), input);
}

export async function deleteReview(id: string) {
  return del<null>(api.reviews.remove(id));
}