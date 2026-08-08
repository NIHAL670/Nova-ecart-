/**
 * Review business logic. A user can review a product only if they have bought
 * it (verified purchase); the Review model keeps product ratings in sync.
 */
import { Types } from 'mongoose';
import { Review, Order, IReview } from '../models';
import { OrderStatus } from '../types/enums';
import { ApiError } from '../utils/ApiError';

export interface ReviewListResult {
  reviews: IReview[];
  avgRating: number;
  count: number;
  distribution: { rating: number; count: number }[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/** True if the user has a delivered order containing this product. */
async function hasPurchased(userId: string, productId: string): Promise<boolean> {
  const order = await Order.findOne({
    user: userId,
    status: { $in: [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.CONFIRMED] },
    'items.product': productId,
  });
  return Boolean(order);
}

export async function createReview(userId: string, input: { product: string; rating: number; title?: string; comment: string; images?: string[] }): Promise<IReview> {
  const existing = await Review.findOne({ user: userId, product: input.product });
  if (existing) throw ApiError.badRequest('You have already reviewed this product');

  const purchased = await hasPurchased(userId, input.product);
  const review = await Review.create({
    ...input,
    user: userId,
    isVerifiedPurchase: purchased,
  });
  return review.populate('user', 'name avatar');
}

export async function updateReview(userId: string, reviewId: string, input: Partial<IReview>): Promise<IReview> {
  const review = await Review.findOneAndUpdate({ _id: reviewId, user: userId }, input, { new: true, runValidators: true });
  if (!review) throw ApiError.notFound('Review');
  return review;
}

export async function deleteReview(userId: string, reviewId: string, isAdmin = false): Promise<void> {
  const query = isAdmin ? { _id: reviewId } : { _id: reviewId, user: userId };
  const review = await Review.findOneAndDelete(query);
  if (!review) throw ApiError.notFound('Review');
}

export async function listReviews(query: { product?: string; page?: number; limit?: number; sort?: string }): Promise<ReviewListResult> {
  const filter = query.product ? { product: query.product } : {};
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highest: { rating: -1 },
    lowest: { rating: 1 },
    helpful: { helpfulCount: -1 },
  };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort(sortMap[query.sort ?? 'newest'] ?? sortMap.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name avatar'),
    Review.countDocuments(filter),
  ]);

  let avgRating = 0;
  let distribution = [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: 0 }));
  if (query.product) {
    const [agg] = await Review.aggregate([
      { $match: { product: new Types.ObjectId(query.product) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, dist: { $push: '$rating' } } },
    ]).allowDiskUse(true).exec();
    avgRating = Math.round((agg?.avg ?? 0) * 10) / 10;
    distribution = [5, 4, 3, 2, 1].map((r) => ({
      rating: r,
      count: (agg?.dist ?? []).filter((x: number) => x === r).length,
    }));
  }

  return {
    reviews,
    avgRating,
    count: total,
    distribution,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
}

export async function getReview(id: string): Promise<IReview> {
  const review = await Review.findById(id).populate('user', 'name avatar');
  if (!review) throw ApiError.notFound('Review');
  return review;
}