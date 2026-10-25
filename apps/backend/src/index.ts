import { env } from './config/env';
import { connectDB, disconnectDB } from './db/connect';
import { createApp } from './app';

/**
 * Application entry point.
 *
 * Startup sequence:
 *   1. Env vars are validated synchronously when env.ts is imported.
 *   2. MongoDB connection is established.
 *   3. Express app is created and the HTTP server starts.
 *   4. Graceful shutdown handlers are registered.
 */
async function main(): Promise<void> {
  // Connect to MongoDB before accepting requests
  await connectDB();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(
      `\n🚀  Atlas Backend is running\n` +
        `   URL:  http://localhost:${env.PORT}\n` +
        `   Mode: ${env.NODE_ENV}\n` +
        `   Health: http://localhost:${env.PORT}/api/v1/health\n`,
    );
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  async function shutdown(signal: string): Promise<void> {
    console.log(`\n${signal} received — shutting down…`);
    server.close(async () => {
      try {
        await disconnectDB();
      } finally {
        process.exit(0);
      }
    });
    // Force exit if shutdown hangs longer than 10 s
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err: unknown) => {
  console.error('❌  Fatal startup error:', err);
  process.exit(1);
});
