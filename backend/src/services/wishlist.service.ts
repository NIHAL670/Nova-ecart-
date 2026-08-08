/**
 * Wishlist business logic — one wishlist doc per user with unique products.
 */
import { Types } from 'mongoose';
import { Product, Wishlist } from '../models';
import { ApiError } from '../utils/ApiError';

async function getOrCreate(userId: string) {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, items: [] });
  return wishlist;
}

export async function getWishlist(userId: string) {
  const wishlist = await getOrCreate(userId);
  await wishlist.populate('items', 'name slug price discountedPrice images rating reviewCount stock status');
  return wishlist.items;
}

export async function toggleItem(userId: string, productId: string): Promise<{ added: boolean; items: unknown }> {
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product');

  const wishlist = await getOrCreate(userId);
  const exists = wishlist.items.some((id) => id.toString() === productId);

  if (exists) {
    wishlist.items = wishlist.items.filter((id) => id.toString() !== productId);
    await wishlist.save();
    return { added: false, items: await getWishlist(userId) };
  }

  wishlist.items.push(product._id as Types.ObjectId);
  await wishlist.save();
  return { added: true, items: await getWishlist(userId) };
}

export async function removeItem(userId: string, productId: string): Promise<unknown> {
  const wishlist = await getOrCreate(userId);
  wishlist.items = wishlist.items.filter((id) => id.toString() !== productId);
  await wishlist.save();
  return getWishlist(userId);
}

export async function isWishlisted(userId: string, productId: string): Promise<boolean> {
  const wishlist = await Wishlist.findOne({ user: userId });
  return wishlist?.items.some((id) => id.toString() === productId) ?? false;
}

export async function clearWishlist(userId: string): Promise<void> {
  const wishlist = await getOrCreate(userId);
  wishlist.items = [];
  await wishlist.save();
}