/**
 * Application entry point. Connects Mongo + Redis, then starts the HTTP server.
 * Handles SIGINT/SIGTERM for graceful shutdown.
 */
import { Server } from 'http';
import createApp from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/database';
import { connectRedis } from './config/redis';
import { findOrCreateAdmin } from './services/auth.service';

async function bootstrap(): Promise<void> {
  await connectDB();
  await connectRedis();
  if (env.NODE_ENV !== 'test') await findOrCreateAdmin();

  const app = createApp();
  const server: Server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 API running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received, shutting down gracefully…`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    // Force exit if connections don't drain within 10s.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Failed to boot server:', err);
  process.exit(1);
});