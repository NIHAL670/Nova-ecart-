/**
 * OTP model — one-time codes for signup verification and password reset.
 *
 * `code` is stored hashed so a leaked DB dump can't reveal OTPs. Only `isValid`
 * on the plaintext code after decrypt/compare is safe, so we store a bcrypt hash.
 * Codes auto-expire via TTL index.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { OtpPurpose } from '../types/enums';

export interface IOtp extends Document {
  email: string;
  codeHash: string;
  purpose: OtpPurpose;
  expiresAt: Date;
  used: boolean;
  attempts: number;
  setCode(plain: string): Promise<void>;
  verifyCode(plain: string): Promise<boolean>;
}

const otpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: Object.values(OtpPurpose), required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Auto-delete expired docs.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// One active OTP per email+purpose (upsert overwrites the old).
otpSchema.index({ email: 1, purpose: 1 }, { unique: true });

otpSchema.methods.setCode = async function (plain: string): Promise<void> {
  const salt = await bcrypt.genSalt(10);
  this.codeHash = await bcrypt.hash(plain, salt);
};

otpSchema.methods.verifyCode = function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.codeHash);
};

export const Otp: Model<IOtp> = mongoose.models.Otp ?? mongoose.model<IOtp>('Otp', otpSchema);