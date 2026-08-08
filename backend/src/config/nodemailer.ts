/**
 * Nodemailer SMTP transport (used for OTP, verify-email and password reset).
 *
 * In development without SMTP credentials the transport is replaced by a
 * "logger" transport that prints emails to the console instead of sending,
 * which keeps local demos fully functional with zero external setup.
 */
import nodemailer, { Transporter } from 'nodemailer';
import { env, isDevelopment } from './env';

const hasSmtp = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

export const mailTransport: Transporter = hasSmtp
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : nodemailer.createTransport({
      // jsonTransport captures the message; we log it below in `sendEmail`.
      jsonTransport: true,
    } as nodemailer.TransportOptions);

export const mailFrom = env.SMTP_FROM;
export const isSmtpConfigured = hasSmtp;

export { isDevelopment as devMode };
