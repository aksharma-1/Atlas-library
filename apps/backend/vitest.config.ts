import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    // Set env vars before any module is evaluated — env.ts reads these at import time
    env: {
      NODE_ENV: 'test',
      PORT: '5001',
      MONGODB_URI: 'mongodb://localhost:27017/atlas_test',
      CORS_ORIGIN: 'http://localhost:5173',
      JWT_SECRET: 'test-jwt-secret-must-be-long-enough-1234',
      JWT_EXPIRES_IN: '1h',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/index.ts'],
    },
  },
});
