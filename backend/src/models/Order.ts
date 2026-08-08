/**
 * Order model.
 *
 * Prices are snapshotted at purchase time (`productId`, name, unitPrice) so the
 * order history is immutable even if a product/pricing changes later. The
 * address is also embedded as a snapshot for the same reason.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../types/enums';

export interface OrderItem {
  product: Types.ObjectId;
  name: string;
  image: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  total: number;
  variant?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  user: Types.ObjectId;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  coupon?: { code: string; type: 'percentage' | 'flat'; value: number; discount: number };
  currency: string;
  subtotal: number; // sum of line-item totals
  discount: number; // coupon savings
  shippingFee: number;
  tax: number;
  taxRate: number;
  total: number; // subtotal - discount + shipping + tax
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  gatewayOrderId?: string;
  trackingNumber?: string;
  timeline: { status: OrderStatus; at: Date; note?: string }[];
  notes?: string;
}

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        image: { type: String, default: '' },
        sku: { type: String },
        unitPrice: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        total: { type: Number, required: true },
        variant: { type: String },
      },
    ],
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    coupon: { code: { type: String }, type: { type: String }, value: { type: Number }, discount: { type: Number } },
    currency: { type: String, default: 'USD' },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING, index: true },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING, index: true },
    paymentId: { type: String },
    gatewayOrderId: { type: String },
    trackingNumber: { type: String },
    timeline: [{ status: { type: String }, at: { type: Date }, note: { type: String } }],
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });

export const Order: Model<IOrder> = mongoose.models.Order ?? mongoose.model<IOrder>('Order', orderSchema);