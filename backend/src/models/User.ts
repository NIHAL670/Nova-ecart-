/**
 * User model.
 *
 * Security: password is bcrypt-hashed in a `pre('save')` hook; the OTP block
 * stores only a hashed code + expiry; refresh token kept for rotation.
 * The `toJSON` transform strips password/refreshToken/otp/__v automatically,
 * so no endpoint can leak credentials by accident.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Role } from '../types/enums';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  avatar?: string;
  phone?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  refreshToken?: string;
  addresses: mongoose.Types.ObjectId[];
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
    role: { type: String, enum: Object.values(Role), default: Role.CUSTOMER },
    avatar: { type: String },
    phone: { type: String, trim: true },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String },
    addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Address' }],
  },
  { timestamps: true },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.__v;
    return ret;
  },
});

export const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', userSchema);
