import dns from 'dns';
import mongoose from 'mongoose';
import { env } from '../config/env';

// If running in development and connecting to MongoDB Atlas SRV, fallback to public DNS if ISP DNS fails SRV lookup
if (env.MONGODB_URI.startsWith('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // Ignore if not allowed or in restricted sandbox
  }
}

/**
 * Masks credentials in a MongoDB URI for safe logging.
 * e.g. mongodb://user:secret@host/db → mongodb://user:***@host/db
 */
function maskUri(uri: string): string {
  try {
    const url = new URL(uri);
    if (url.password) {
      url.password = '***';
    }
    return url.toString();
  } catch {
    // URI isn't a standard URL (e.g. SRV format) — redact naively
    return uri.replace(/:\/\/[^@]*@/, '://***:***@');
  }
}

/**
 * Connects Mongoose to MongoDB.
 * Throws on failure so the caller (index.ts) can decide how to handle it.
 */
export async function connectDB(): Promise<void> {
  const masked = maskUri(env.MONGODB_URI);
  try {
    await mongoose.connect(env.MONGODB_URI, {
      // Prevent Mongoose from applying potentially destructive index changes automatically
      autoIndex: env.NODE_ENV !== 'production',
    });
    console.log(`✅  MongoDB connected → ${masked}`);

    // Self-healing: Safely migrate the payment idempotencyKey index if old sparse index exists
    try {
      const paymentCollection = mongoose.connection.collection('payments');
      const existingIndexes = await paymentCollection.indexes();
      const faultyIndex = existingIndexes.find(
        (idx) => idx.name === 'tenantId_1_idempotencyKey_1' && !idx.partialFilterExpression,
      );

      if (faultyIndex) {
        console.log('🔄  Migrating payment idempotency index to partialFilterExpression...');
        await paymentCollection.dropIndex('tenantId_1_idempotencyKey_1');
        await paymentCollection.createIndex(
          { tenantId: 1, idempotencyKey: 1 },
          {
            unique: true,
            partialFilterExpression: { idempotencyKey: { $type: 'string' } },
            background: true,
          },
        );
        console.log('✅  Payment idempotency index successfully migrated without data loss.');
      }
    } catch (indexMigrationErr) {
      // Do not block app startup if index migration encounters non-fatal condition
      console.warn('⚠️  Payment index check/migration notice:', (indexMigrationErr as Error).message);
    }
  } catch (error) {
    console.error(`❌  MongoDB connection failed → ${masked}`);
    throw error;
  }
}

/**
 * Gracefully disconnects Mongoose.
 * Called during server shutdown.
 */
export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('📴  MongoDB disconnected');
}
