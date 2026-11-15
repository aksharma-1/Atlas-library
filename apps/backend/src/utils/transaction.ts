import mongoose, { ClientSession } from 'mongoose';
import { env } from '../config/env';

/**
 * Checks whether the current MongoDB connection supports multi-document transactions.
 * Transactions require a replica set (Atlas cluster, local replica set) or sharded cluster.
 */
export function supportsTransactions(): boolean {
  try {
    const client = mongoose.connection.getClient() as any;
    const topology = client?.topology?.description;
    if (!topology) return false;
    if (topology.setName || topology.type === 'ReplicaSetWithPrimary' || topology.type === 'Sharded') {
      return true;
    }
    const servers = Array.from(topology.servers?.values() ?? []);
    if (servers.length > 0 && servers.some((s: any) => s.type === 'RSPrimary' || s.type === 'RSSecondary')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Executes a callback within a managed MongoDB session and transaction when available.
 *
 * In production (MongoDB Atlas replica-set), transactions are strictly enforced.
 * If transactions are supported, commits, aborts on failure, and ends the session.
 * In a standalone test/dev environment without a replica set, executes the callback with undefined session.
 */
export async function withTransaction<T>(
  callback: (session?: ClientSession) => Promise<T>,
): Promise<T> {
  const canUseTx = supportsTransactions();

  if (env.NODE_ENV === 'production' && !canUseTx) {
    throw new Error(
      'MongoDB replica-set is required in production to guarantee transaction atomicity.',
    );
  }

  if (!canUseTx) {
    return callback(undefined);
  }

  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    return result!;
  } finally {
    await session.endSession();
  }
}
