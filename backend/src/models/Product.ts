/**
 * Product model.
 *
 * Pricing: `price` is the current selling price; `compareAtPrice` (optional) is
 * the strikethrough "original"; `discountedPrice` overrides `price` when a
 * temporary promo is active. `rating`/`reviewCount` are denormalised and kept
 * current by the Review model's update middleware.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IProductVariant {
  name: string; // e.g. "Color: Red / Size: M"
  sku: string;
  price?: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: Types.ObjectId;
  subCategory?: Types.ObjectId;
  brand?: string;
  tags: string[];
  images: { url: string; publicId?: string }[];
  price: number;
  discountedPrice?: number;
  compareAtPrice?: number;
  currency: string;
  stock: number;
  sku: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  onSale: boolean;
  status: 'active' | 'draft' | 'archived';
  rating: number;
  reviewCount: number;
  soldCount: number;
  variants: IProductVariant[];
  attributes: Record<string, string>;
  deletedAt?: Date;
  effectivePrice: number;
  discountPercent: number;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 160, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    shortDescription: { type: String, maxlength: 300 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
    brand: { type: String, trim: true, index: true },
    tags: [{ type: String, trim: true }],
    images: [{ url: { type: String }, publicId: { type: String } }],
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    currency: { type: String, default: 'USD' },
    stock: { type: Number, default: 0, min: 0, index: true },
    sku: { type: String, trim: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    onSale: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active', index: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    variants: [
      {
        name: { type: String },
        sku: { type: String },
        price: { type: Number },
        stock: { type: Number, default: 0 },
        attributes: { type: Map, of: String },
      },
    ],
    attributes: { type: Map, of: String },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

// Text index for keyword search across name/description/brand/tags.
productSchema.index(
  { name: 'text', description: 'text', brand: 'text', tags: 'text' },
  { weights: { name: 5, brand: 3, tags: 2, description: 1 }, name: 'product_text_search' },
);

productSchema.virtual('effectivePrice').get(function (this: IProduct) {
  return this.discountedPrice ?? this.price;
});

productSchema.virtual('discountPercent').get(function (this: IProduct) {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
});

export const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>('Product', productSchema);