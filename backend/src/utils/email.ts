/**
 * Email helpers on top of the nodemailer transport.
 *
 * `sendMail` logs the message in dev (where no SMTP exists) and actually sends
 * in production. Never throws to the caller — email failures are logged and
 * swallowed so a broken mail server can't take down registration.
 */
import { mailFrom, mailTransport, isSmtpConfigured, devMode } from '../config/nodemailer';
import { env } from '../config/env';

interface MailArgs {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

export async function sendMail({ to, subject, html, text }: MailArgs): Promise<boolean> {
  try {
    await mailTransport.sendMail({ from: mailFrom, to, subject, html, text });
    if (devMode && !isSmtpConfigured) {
      // eslint-disable-next-line no-console
      console.log(`📧 [DEV] Would send "${subject}" to ${to}`);
    }
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Email send failed:', err);
    return false;
  }
}

/** OTP email used by signup verification & password reset. */
export async function sendOtpEmail(to: string, otp: string, purpose: 'verify' | 'reset'): Promise<boolean> {
  const title = purpose === 'verify' ? 'Verify your email' : 'Reset your password';
  return sendMail({
    to,
    subject: `${title} — Nova Cart`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <h2 style="margin:0 0 8px">${title}</h2>
        <p>Your one-time code is:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#2563eb">${otp}</p>
        <p>This code expires in <strong>10 minutes</strong>. If you didn't request it, you can safely ignore this email.</p>
        <p style="color:#888;font-size:12px;margin-top:24px">Nova Cart — secure e-commerce demo</p>
      </div>`,
  });
}

/** Welcome + email verification link email. */
export async function sendVerifyLinkEmail(to: string, verifyUrl: string): Promise<boolean> {
  return sendMail({
    to,
    subject: 'Verify your email — Nova Cart',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <h2>Welcome to Nova Cart 🛍️</h2>
        <p>Please confirm your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Verify email</a>
        <p style="color:#888;font-size:12px;margin-top:24px">Link expires in 24 hours.</p>
      </div>`,
  });
}

/** Convenience for the verify-link URL (CLIENT_URL is the frontend origin). */
export function buildVerifyUrl(token: string): string {
  return `${env.CLIENT_URL}/verify-email?token=${token}`;
}

/** Convenience for the password reset URL. */
export function buildResetUrl(token: string): string {
  return `${env.CLIENT_URL}/reset-password?token=${token}`;
}

export { env };
