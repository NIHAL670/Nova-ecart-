/**
 * Category model — supports hierarchical subcategories via a self `parent` ref.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: mongoose.Types.ObjectId;
  isActive: boolean;
  sortOrder: number;
  productCount?: number; // virtual-ish convenience populated by aggregation
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: [true, 'Category name is required'], trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, maxlength: 500 },
    image: { type: String },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

categorySchema.virtual('children', { ref: 'Category', localField: '_id', foreignField: 'parent' });

export const Category: Model<ICategory> =
  mongoose.models.Category ?? mongoose.model<ICategory>('Category', categorySchema);
