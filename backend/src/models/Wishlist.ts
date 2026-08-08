/**
 * Wishlist model — one document per user holding many product references.
 * The `items` array guarantees uniqueness at the schema level.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IWishlist extends Document {
  user: Types.ObjectId;
  items: Types.ObjectId[];
}

const wishlistSchema = new Schema<IWishlist>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true },
);

export const Wishlist: Model<IWishlist> =
  mongoose.models.Wishlist ?? mongoose.model<IWishlist>('Wishlist', wishlistSchema);