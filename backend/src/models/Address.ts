/**
 * Address model — one user has many addresses; `isDefault` flags the primary one.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAddress extends Document {
  user: Types.ObjectId;
  label: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const addressSchema = new Schema<IAddress>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    name: { type: String, required: [true, 'Recipient name is required'], trim: true },
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    addressLine1: { type: String, required: [true, 'Address line 1 is required'] },
    addressLine2: { type: String },
    city: { type: String, required: [true, 'City is required'] },
    state: { type: String, required: [true, 'State is required'] },
    postalCode: { type: String, required: [true, 'Postal code is required'] },
    country: { type: String, required: [true, 'Country is required'], default: 'India' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Address: Model<IAddress> =
  mongoose.models.Address ?? mongoose.model<IAddress>('Address', addressSchema);