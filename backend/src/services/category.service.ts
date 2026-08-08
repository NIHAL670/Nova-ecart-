/**
 * Category business logic — flat CRUD plus a populated tree for the UI nav.
 */
import { Category, ICategory } from '../models';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';

async function ensureUniqueSlug(slug: string, ignoreId?: string): Promise<string> {
  let candidate = slug;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const where: Record<string, unknown> = { slug: candidate };
    if (ignoreId) where._id = { $ne: ignoreId };
    const exists = await Category.exists(where);
    if (!exists) return candidate;
    candidate = `${slug}-${n++}`;
  }
}

export async function listCategories(includeInactive = false): Promise<ICategory[]> {
  const filter = includeInactive ? {} : { isActive: true };
  return Category.find(filter).sort({ sortOrder: 1, name: 1 });
}

/** Returns categories with a nested `children` array and live product counts. */
export async function getCategoryTree(): Promise<Record<string, unknown>[]> {
  const cats = await Category.find({ isActive: true }).populate('children', 'name slug _id image').sort({ sortOrder: 1 });
  const counts = await Category.aggregate([
    { $lookup: { from: 'products', localField: '_id', foreignField: 'category', as: 'products' } },
    { $project: { _id: 1, count: { $size: '$products' } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  return cats.map((cat) => {
    const obj = cat.toObject() as unknown as Record<string, unknown>;
    return { ...obj, children: obj.children ?? [], productCount: countMap.get(String(cat._id)) ?? 0 };
  });
}

export async function getCategoryById(id: string): Promise<ICategory> {
  const cat = await Category.findById(id).populate('children');
  if (!cat) throw ApiError.notFound('Category');
  return cat;
}

export async function getCategoryBySlug(slug: string): Promise<ICategory> {
  const cat = await Category.findOne({ slug });
  if (!cat) throw ApiError.notFound('Category');
  return cat;
}

export async function createCategory(input: Partial<ICategory>): Promise<ICategory> {
  const slug = input.slug ?? slugify(input.name ?? 'category');
  return Category.create({ ...input, slug: await ensureUniqueSlug(slug) });
}

export async function updateCategory(id: string, input: Partial<ICategory>): Promise<ICategory> {
  const cat = await Category.findById(id);
  if (!cat) throw ApiError.notFound('Category');
  if (input.name) {
    input.slug = await ensureUniqueSlug(slugify(input.name), id);
  }
  Object.assign(cat, input);
  await cat.save();
  return cat;
}

export async function deleteCategory(id: string): Promise<void> {
  const cat = await Category.findById(id);
  if (!cat) throw ApiError.notFound('Category');
  // Prevent deleting a parent that still has children.
  const hasChildren = await Category.exists({ parent: id });
  if (hasChildren) throw ApiError.badRequest('Cannot delete a category that has subcategories');
  await cat.deleteOne();
}