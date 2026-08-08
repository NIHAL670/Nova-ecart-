/**
 * MongoDB connection via Mongoose.
 *
 * - Disables the (deprecated) collection.autoCreate warning
 * - Connects lazily so tests / scripts can import the module without I/O
 * - Registers a global "connected" log for ops sanity
 */
import mongoose from 'mongoose';
import { env, isDevelopment } from './env';

const MONGO_URI = env.MONGODB_URI;

mongoose.connection.on('connected', () => {
  if (isDevelopment) {
    // eslint-disable-next-line no-console
    console.log('📦 MongoDB connected');
  }
});

mongoose.connection.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('❌ MongoDB connection error:', err.message);
});

export async function connectDB(): Promise<void> {
  await mongoose.connect(MONGO_URI, {
    autoIndex: isDevelopment, // build indexes automatically only in dev
    serverSelectionTimeoutMS: 10_000,
  });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

export default connectDB;
