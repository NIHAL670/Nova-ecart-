/**
 * OTP lifecycle helper — generate, persist (hashed), resend, verify.
 */
import crypto from 'crypto';
import { Otp } from '../models';
import { OtpPurpose } from '../types/enums';
import { ApiError } from '../utils/ApiError';
import { sendOtpEmail } from '../utils/email';
import { env } from '../config/env';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Create (or replace) an OTP for an email+purpose, then email the code.
 * Returns the code so dev/demo environments can display it in the console.
 */
export async function createAndSendOtp(email: string, purpose: OtpPurpose): Promise<string> {
  const code = generateOtp();

  // Reset any previous OTP for this email+purpose, then upsert a fresh one.
  await Otp.deleteMany({ email, purpose });

  const doc = new Otp({ email, purpose, expiresAt: new Date(Date.now() + OTP_TTL_MS) });
  await doc.setCode(code);
  await doc.save();

  await sendOtpEmail(email, code, purpose === OtpPurpose.SIGNUP ? 'verify' : 'reset');
  return code;
}

/**
 * Verify a submitted code. Consumes the OTP on success and guards against
 * brute-force by capping failed attempts.
 */
export async function verifyOtp(email: string, code: string, purpose: OtpPurpose): Promise<void> {
  const doc = await Otp.findOne({ email, purpose });
  if (!doc) throw ApiError.badRequest('OTP not found. Please request a new code.');

  if (doc.used) throw ApiError.badRequest('OTP already used');
  if (doc.expiresAt.getTime() < Date.now()) throw ApiError.badRequest('OTP has expired. Please request a new code.');
  if (doc.attempts >= MAX_ATTEMPTS) throw ApiError.badRequest('Too many attempts. Please request a new code.');

  const isValid = await doc.verifyCode(code);
  if (!isValid) {
    doc.attempts += 1;
    await doc.save();
    throw ApiError.badRequest('Invalid OTP');
  }

  doc.used = true;
  await doc.save();
}

export async function createAndSendOtpForPhone(email: string, phone: string, purpose: OtpPurpose): Promise<string> {
  const code = generateOtp();
  await Otp.deleteMany({ email, purpose });
  const doc = new Otp({ email, purpose, expiresAt: new Date(Date.now() + OTP_TTL_MS) });
  await doc.setCode(code);
  await doc.save();

  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
    try {
      const authString = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            From: env.TWILIO_PHONE_NUMBER,
            Body: `Your Nova Cart verification code is: ${code}`,
          }).toString(),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        // eslint-disable-next-line no-console
        console.error(`[Twilio Error] Failed to send SMS: ${errText}`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`[Twilio] Successfully sent OTP SMS to: ${phone}`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Twilio Error] Exception during SMS sending:', err);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(`[SMS] Sending OTP ${code} to phone number: ${phone} (Twilio not configured)`);
  }

  return code;
}