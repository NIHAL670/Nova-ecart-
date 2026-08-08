/**
 * Product business logic.
 *
 * The GET list path uses the reusable ApiFeatures builder (search, filter,
 * price-range, sort, pagination), and optionally caches in Redis. Mutations
 * invalidate the affected caches.
 */
import { Product, IProduct, Category } from '../models';
import { ApiFeatures } from '../utils/ApiFeatures';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';
import { cacheKeys as ck } from '../types/enums';
import { cache as redis } from '../config/redis';
import mongoose from 'mongoose';

export interface ListResult {
  products: IProduct[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

async function ensureUniqueSlug(slug: string, ignoreId?: string): Promise<string> {
  let candidate = slug;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const where: Record<string, unknown> = { slug: candidate, deletedAt: null };
    if (ignoreId) where._id = { $ne: ignoreId };
    if (!(await Product.exists(where))) return candidate;
    candidate = `${slug}-${n++}`;
  }
}

export async function listProducts(queryString: Record<string, unknown>): Promise<ListResult> {
  const query = { ...queryString };

  // Resolve category name/slug/ID to ObjectIds
  if (query.category) {
    const categoryVal = String(query.category);
    const slugVal = slugify(categoryVal);
    const categoryDoc = await Category.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(categoryVal) ? [{ _id: categoryVal }] : []),
        { slug: slugVal },
        { name: new RegExp(`^${categoryVal}$`, 'i') },
      ],
    });

    if (categoryDoc) {
      const children = await Category.find({ parent: categoryDoc._id });
      const categoryIds = [categoryDoc._id, ...children.map((c) => c._id)];
      delete query.category;
      query.$or = [
        { category: { $in: categoryIds } },
        { subCategory: { $in: categoryIds } },
      ];
    } else {
      delete query.category;
      query._id = new mongoose.Types.ObjectId();
    }
  }

  // Resolve subCategory name/slug/ID to ObjectIds
  if (query.subCategory) {
    const subCategoryVal = String(query.subCategory);
    const slugVal = slugify(subCategoryVal);
    const subCategoryDoc = await Category.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(subCategoryVal) ? [{ _id: subCategoryVal }] : []),
        { slug: slugVal },
        { name: new RegExp(`^${subCategoryVal}$`, 'i') },
      ],
    });

    if (subCategoryDoc) {
      delete query.subCategory;
      if (query.$or) {
        query.$and = [
          { $or: query.$or as any },
          { $or: [{ category: subCategoryDoc._id }, { subCategory: subCategoryDoc._id }] },
        ];
        delete query.$or;
      } else {
        query.$or = [
          { category: subCategoryDoc._id },
          { subCategory: subCategoryDoc._id },
        ];
      }
    } else {
      delete query.subCategory;
      query._id = new mongoose.Types.ObjectId();
    }
  }

  const features = new ApiFeatures<IProduct>(Product, query, ['name', 'brand', 'description', 'tags']);
  features.search().filter().priceRange().sort().paginate().build();
  const [products, total] = await Promise.all([
    features.execute<IProduct>(),
    Product.countDocuments(features.getFilter()),
  ]);
  const { page, limit } = features.build();
  return { products, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function getProductById(id: string): Promise<IProduct> {
  // Try cache first.
  const cached = await redis.get(ck.product(id));
  if (cached) return JSON.parse(cached);

  const product = await Product.findById(id).where({ status: 'active', deletedAt: null });
  if (!product) throw ApiError.notFound('Product');
  await redis.set(ck.product(id), JSON.stringify(product), 300);
  return product;
}

export async function getProductBySlug(slug: string): Promise<IProduct> {
  const product = await Product.findOne({ slug }).where({ status: 'active', deletedAt: null });
  if (!product) throw ApiError.notFound('Product');
  return product;
}

export async function createProduct(input: Partial<IProduct>): Promise<IProduct> {
  const slug = await ensureUniqueSlug(slugify(input.name ?? 'product'));
  return Product.create({ ...input, slug });
}

export async function updateProduct(id: string, input: Partial<IProduct>): Promise<IProduct> {
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product');
  if (input.name && input.name !== product.name) {
    input.slug = await ensureUniqueSlug(slugify(input.name), id);
  }
  Object.assign(product, input);
  await product.save();
  await redis.del(ck.product(id));
  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product');
  // Soft delete so order history references stay intact.
  product.deletedAt = new Date();
  product.status = 'archived';
  await product.save();
  await redis.del(ck.product(id));
}

// --- Home-page collections ------------------------------------------------

export async function featuredProducts(limit = 12): Promise<IProduct[]> {
  return Product.find({ isFeatured: true, status: 'active', deletedAt: null })
    .sort({ rating: -1, createdAt: -1 })
    .limit(limit);
}

export async function bestSellers(limit = 12): Promise<IProduct[]> {
  return Product.find({ isBestSeller: true, status: 'active', deletedAt: null })
    .sort({ soldCount: -1 })
    .limit(limit);
}

export async function latestArrivals(limit = 12): Promise<IProduct[]> {
  return Product.find({ isNewArrival: true, status: 'active', deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(limit);
}

export async function specialOffers(limit = 12): Promise<IProduct[]> {
  return Product.find({ onSale: true, status: 'active', deletedAt: null })
    .sort({ compareAtPrice: -1 })
    .limit(limit);
}

export async function trendingProducts(limit = 12): Promise<IProduct[]> {
  return Product.find({ status: 'active', deletedAt: null })
    .sort({ soldCount: -1, rating: -1 })
    .limit(limit);
}

/** Same-category products excluding the current one, rated best-first. */
export async function relatedProducts(productId: string, categoryId: string, limit = 8): Promise<IProduct[]> {
  return Product.find({
    category: categoryId,
    _id: { $ne: productId },
    status: 'active',
    deletedAt: null,
  })
    .sort({ rating: -1, soldCount: -1 })
    .limit(limit);
}

export async function searchSuggestions(query: string, limit = 8): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const textResults = await Product.find(
    { $text: { $search: trimmed }, status: 'active', deletedAt: null },
    { score: { $meta: 'textScore' }, name: 1, _id: 0 },
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean();

  if (textResults.length > 0) {
    return textResults.map((r) => (r as { name: string }).name);
  }

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fallback = await Product.find(
    { name: { $regex: escaped, $options: 'i' }, status: 'active', deletedAt: null },
    { name: 1, _id: 0 },
  )
    .limit(limit)
    .lean();
  return fallback.map((r) => (r as { name: string }).name);
}