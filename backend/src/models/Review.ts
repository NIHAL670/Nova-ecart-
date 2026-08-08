/**
 * Review model.
 *
 * Keeps `Product.rating` / `Product.reviewCount` denormalised and in sync via
 * post-save / post-delete hooks that recompute the product aggregate rating.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { Product } from './Product';

export interface IReview extends Document {
  user: Types.ObjectId;
  product: Types.ObjectId;
  rating: number; // 1..5
  title?: string;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    rating: { type: Number, required: [true, 'Rating is required'], min: 1, max: 5 },
    title: { type: String, maxlength: 120 },
    comment: { type: String, required: [true, 'Comment is required'], maxlength: 1000 },
    images: [{ type: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// One review per user per product.
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

async function recomputeProductRating(productId: Types.ObjectId): Promise<void> {
  const result = await mongoose.models.Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = result[0] ?? {};
  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(avg * 10) / 10,
    reviewCount: count,
  });
}

reviewSchema.post('save', function () {
  void recomputeProductRating(this.product);
});

reviewSchema.post('findOneAndDelete', function (doc: IReview | null) {
  if (doc) void recomputeProductRating(doc.product);
});

export const Review: Model<IReview> = mongoose.models.Review ?? mongoose.model<IReview>('Review', reviewSchema);