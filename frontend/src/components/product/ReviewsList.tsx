'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, MessageSquarePlus, Star } from 'lucide-react';
import { fetchReviews } from '@/services/review.service';
import { queryKeys } from '@/constants';
import { timeAgo, avatarUrl } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Rating } from '@/components/common/Rating';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

interface ReviewsListProps {
  productId: string;
}

const REVIEW_SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'highest', label: 'Highest rating' },
  { value: 'lowest', label: 'Lowest rating' },
  { value: 'helpful', label: 'Most helpful' },
];

export function ReviewsList({ productId }: ReviewsListProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');

  const query = useQuery({
    queryKey: queryKeys.reviews(productId, page),
    queryFn: () => fetchReviews(productId, page, sort),
  });

  const data = query.data;
  const items = data?.items ?? [];
  const total = data?.meta?.total ?? 0;
  const pages = data?.meta?.pages ?? 0;

  const pageNumbers = () => {
    if (pages <= 1) return [];
    const current = data?.meta.page ?? 1;
    let start = Math.max(1, current - 2);
    const end = Math.min(pages, start + 4);
    start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid gap-8 rounded-2xl border bg-card p-6 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center text-center">
          {query.isLoading || !data ? (
            <Skeleton className="h-16 w-24" />
          ) : (
            <>
              <p className="font-display text-5xl font-bold">{Number(data.avgRating).toFixed(1)}</p>
              <Rating value={data.avgRating} size="md" showCount={false} className="mt-2" />
              <p className="mt-1 text-xs text-muted-foreground">Based on {total} review{total === 1 ? '' : 's'}</p>
            </>
          )}
        </div>

        <div className="flex flex-col justify-center gap-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const entry = (data?.distribution ?? []).find((d) => d.rating === star);
            const count = entry?.count ?? 0;
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="flex w-8 items-center gap-1 font-medium">
                  {star} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${query.isLoading ? 0 : pct}%` }} />
                </div>
                <span className="w-8 text-right tabular-nums text-xs text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{total}</span> review{total === 1 ? '' : 's'}
        </p>
        <Select value={sort} onValueChange={(v) => {
          setSort(v);
          setPage(1);
        }}>
          <SelectTrigger className="h-10 w-auto min-w-[150px] rounded-full" aria-label="Sort reviews">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {REVIEW_SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {query.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="mt-4 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={MessageSquarePlus}
          title="No reviews yet"
          description="Be the first to share your thoughts on this product."
        />
      ) : (
        <ul className="space-y-4">
          {items.map((review) => (
            <li key={review._id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={review.user.avatar ?? avatarUrl(review.user.name)} alt={review.user.name} />
                    <AvatarFallback>
                      {review.user.name
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{review.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {review.isVerifiedPurchase && (
                        <span className="mr-1 text-emerald-600">Verified purchase ·</span>
                      )}
                      {timeAgo(review.createdAt)}
                    </p>
                  </div>
                </div>
                <Rating value={review.rating} size="sm" showCount={false} />
              </div>

              {review.title && <h4 className="mt-3 text-sm font-semibold">{review.title}</h4>}
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>

              {review.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {review.images.map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={img} alt="Review attachment" className="h-16 w-16 rounded-lg object-cover" />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={!data?.meta.page || data.meta.page <= 1}
            onClick={() => data?.meta.page && setPage(data.meta.page - 1)}
            aria-label="Previous reviews"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pageNumbers().map((p) => (
            <Button
              key={p}
              type="button"
              variant={p === data?.meta.page ? 'default' : 'outline'}
              size="icon-sm"
              onClick={() => setPage(p)}
              aria-current={p === data?.meta.page ? 'page' : undefined}
            >
              {p}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={!data?.meta.page || data.meta.page >= pages}
            onClick={() => data?.meta && setPage(data.meta.page + 1)}
            aria-label="Next reviews"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}