/**
 * Express application factory.
 *
 * Middleware order matters:
 *  1. security (helmet, cors, mongo-sanitize, hpp)
 *  2. body parsing + cookies
 *  3. logging (morgan) + compression
 *  4. rate limit (API-wide)
 *  5. routes
 *  6. 404 + global error handler
 */
import path from 'path';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import { env, isProduction } from './config/env';
import { apiLimiter } from './middlewares/rateLimiter';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

import apiRoutes from './routes/index';

export function createApp(): Application {
  const app = express();

  // --- Security ---
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!isProduction) return cb(null, true);
        if (!origin) return cb(null, true);
        if (
          env.CORS_ORIGIN.includes('*') ||
          env.CORS_ORIGIN.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.endsWith('.netlify.app') ||
          origin.endsWith('.render.com') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')
        ) {
          return cb(null, true);
        }
        cb(new Error(`Origin ${origin} not allowed by CORS. Please set CORS_ORIGIN in your environment variables.`));
      },
      credentials: true,
    }),
  );
  app.use(mongoSanitize()); // strip $ and . from body/query
  app.use(hpp()); // dedupe duplicate query params

  // --- Parsers ---
  // `verify` stores the raw request body so webhook handlers can recompute
  // gateway signatures over the exact bytes (JSON parsing would lose fidelity).
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        (req as unknown as { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // --- Logging & compression ---
  if (!isProduction) app.use(morgan('dev'));
  else app.use(morgan('combined'));
  app.use(compression());

  // Serve local uploads (dev fallback when Cloudinary is not configured).
  app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

  // --- Global rate limit ---
  app.use('/api', apiLimiter);

  // --- Health ---
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ success: true, message: 'OK', uptime: process.uptime() });
  });

  // --- API v1 ---
  app.use('/api/v1', apiRoutes);

  // --- 404 + errors ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
