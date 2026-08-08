/**
 * Coupon business logic — admin CRUD plus runtime validation/discount math.
 */
import { Types } from 'mongoose';
import { Coupon, ICoupon } from '../models';
import { CouponType } from '../types/enums';
import { ApiError } from '../utils/ApiError';

const toObjectIds = (ids?: string[]) => ids?.map((id) => new Types.ObjectId(id));

export async function listCoupons(includeInactive = false): Promise<ICoupon[]> {
  return Coupon.find(includeInactive ? {} : { isActive: true }).sort({ createdAt: -1 });
}

export async function getCoupon(id: string): Promise<ICoupon> {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw ApiError.notFound('Coupon');
  return coupon;
}

export async function createCoupon(input: Partial<ICoupon> & { appliesToCategories?: string[]; appliesToProducts?: string[] }): Promise<ICoupon> {
  const { appliesToCategories, appliesToProducts, ...rest } = input;
  const coupon = await Coupon.create({
    ...rest,
    code: (rest.code ?? '').toUpperCase(),
    appliesTo: {
      all: !appliesToCategories?.length && !appliesToProducts?.length,
      categories: toObjectIds(appliesToCategories),
      products: toObjectIds(appliesToProducts),
    },
  });
  return coupon;
}

export async function updateCoupon(id: string, input: Partial<ICoupon> & { appliesToCategories?: string[]; appliesToProducts?: string[] }): Promise<ICoupon> {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw ApiError.notFound('Coupon');

  const { appliesToCategories, appliesToProducts, ...rest } = input;
  if (rest.code) rest.code = rest.code.toUpperCase();
  if (appliesToCategories !== undefined || appliesToProducts !== undefined) {
    coupon.appliesTo = {
      all: !appliesToCategories?.length && !appliesToProducts?.length,
      categories: toObjectIds(appliesToCategories),
      products: toObjectIds(appliesToProducts),
    };
  }
  Object.assign(coupon, rest);
  await coupon.save();
  return coupon;
}

export async function deleteCoupon(id: string): Promise<void> {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw ApiError.notFound('Coupon');
  await coupon.deleteOne();
}

export interface CouponValidation {
  coupon: ICoupon;
  discount: number; // computed savings for the given subtotal
}

/**
 * Validate a code against time/usage rules and compute the discount.
 * Scoped coupons (categories/products) are accepted only if they contain at
 * least one of the provided product/category ids.
 */
export async function validateCoupon(code: string, opts: { subtotal: number; productIds?: string[]; categoryIds?: string[] }): Promise<CouponValidation> {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw ApiError.badRequest('Invalid coupon code');
  if (!coupon.isActive) throw ApiError.badRequest('This coupon is no longer active');

  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) throw ApiError.badRequest('This coupon is not valid yet');
  if (coupon.validUntil && now > coupon.validUntil) throw ApiError.badRequest('This coupon has expired');

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw ApiError.badRequest('This coupon has reached its usage limit');
  if (opts.subtotal < (coupon.minOrderAmount ?? 0)) {
    throw ApiError.badRequest(`Minimum order amount for this coupon is ${coupon.minOrderAmount}`);
  }

  // Scope check — restrict the coupon to certain categories/products.
  if (!coupon.appliesTo.all) {
    const categoryMatch = coupon.appliesTo.categories?.some((c) => opts.categoryIds?.includes(String(c)));
    const productMatch = coupon.appliesTo.products?.some((p) => opts.productIds?.includes(String(p)));
    if (!categoryMatch && !productMatch) throw ApiError.badRequest('Coupon does not apply to the items in your cart');
  }

  let discount = 0;
  if (coupon.type === CouponType.PERCENTAGE) {
    discount = (opts.subtotal * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = Math.min(coupon.value, opts.subtotal);
  }
  discount = Math.round(discount * 100) / 100;

  return { coupon, discount };
}

export async function incrementUsage(id: string): Promise<void> {
  await Coupon.findByIdAndUpdate(id, { $inc: { usedCount: 1 } });
}