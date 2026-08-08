/**
 * Coupon model — percentage or flat discount with validity, usage limits and
 * optional scope restrictions (whole cart or specific categories/products).
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { CouponType } from '../types/enums';

export interface ICoupon extends Document {
  code: string;
  description?: string;
  type: CouponType;
  value: number; // percentage (0-100) or flat amount
  maxDiscount?: number; // cap for percentage coupons
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  appliesTo: {
    all: boolean;
    categories?: Types.ObjectId[];
    products?: Types.ObjectId[];
  };
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, maxlength: 300 },
    type: { type: String, enum: Object.values(CouponType), required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    minOrderAmount: { type: Number, min: 0, default: 0 },
    maxUses: { type: Number, min: 0 },
    usedCount: { type: Number, default: 0 },
    appliesTo: {
      all: { type: Boolean, default: true },
      categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
      products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    },
    validFrom: { type: Date },
    validUntil: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Coupon: Model<ICoupon> = mongoose.models.Coupon ?? mongoose.model<ICoupon>('Coupon', couponSchema);