import { get } from '@/lib/api';
import { api } from '@/constants';

export interface CouponValidationResult {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  discount: number;
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidationResult> {
  return get<CouponValidationResult>(`${api.coupons.validate}?code=${encodeURIComponent(code)}&subtotal=${subtotal}`);
}