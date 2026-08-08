import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/ecommerce_test',
      JWT_ACCESS_SECRET: 'test_access_secret_1234567890',
      JWT_REFRESH_SECRET: 'test_refresh_secret_1234567890',
      REDIS_ENABLED: 'false',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});