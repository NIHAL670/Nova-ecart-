/**
 * Model barrel — import models from one place to guarantee registration order.
 */
export { User } from './User';
export { Product } from './Product';
export { Category } from './Category';
export { Review } from './Review';
export { Order } from './Order';
export { Coupon } from './Coupon';
export { Wishlist } from './Wishlist';
export { Address } from './Address';
export { Otp } from './Otp';

export type { IUser } from './User';
export type { IProduct, IProductVariant } from './Product';
export type { ICategory } from './Category';
export type { IReview } from './Review';
export type { IOrder, OrderItem } from './Order';
export type { ICoupon } from './Coupon';
export type { IWishlist } from './Wishlist';
export type { IAddress } from './Address';
export type { IOtp } from './Otp';
