import mongoose, { ClientSession } from 'mongoose';
import { Tenant } from '../models/Tenant';
import { Seat } from '../models/Seat';

/**
 * Startup synchronization hook:
 * Safely initializes missing `currentSeatCount` fields on any existing tenants
 * BEFORE the HTTP server begins accepting requests.
 *
 * Rules:
 * 1. Only targets tenants where `currentSeatCount` is missing ($exists: false) or null.
 * 2. Uses conditional filter `{ _id: t._id, $or: [{ currentSeatCount: { $exists: false } }, { currentSeatCount: null }] }`
 *    so if another instance or request already initialized the counter, it will NOT be overwritten.
 * 3. Does not modify or delete any seat records.
 * 4. Safe across multiple concurrent server startups (multi-instance Render deployments).
 */
export async function initializeMissingTenantSeatCounts(): Promise<void> {
  try {
    const uninitializedTenants = await Tenant.find(
      {
        $or: [{ currentSeatCount: { $exists: false } }, { currentSeatCount: null }],
      },
      '_id name',
    ).lean();

    if (uninitializedTenants.length === 0) {
      return;
    }

    console.log(`🔄  Found ${uninitializedTenants.length} tenant(s) with uninitialized seat counter. Calculating actual counts...`);

    for (const t of uninitializedTenants) {
      const actualCount = await Seat.countDocuments({ tenantId: t._id });

      await Tenant.updateOne(
        {
          _id: t._id,
          $or: [{ currentSeatCount: { $exists: false } }, { currentSeatCount: null }],
        },
        {
          $set: { currentSeatCount: actualCount },
        },
      );
    }

    console.log(`✅  Successfully initialized seat counters for ${uninitializedTenants.length} tenant(s).`);
  } catch (err) {
    console.warn('⚠️  Notice during tenant seat count initialization:', (err as Error).message);
  }
}

/**
 * Ensures that a tenant's `currentSeatCount` is accurate and initialized
 * before seat operations. Always synchronizes to the real Seat document count
 * if uninitialized or if drift is detected.
 *
 * @param tenantId Tenant ID
 * @param session Mongoose client session (if running in a transaction)
 * @returns Real, verified seat count
 */
export async function ensureTenantSeatCountInitialized(
  tenantId: string | mongoose.Types.ObjectId,
  session?: ClientSession,
): Promise<number> {
  const countQuery = Seat.countDocuments({ tenantId });
  if (session) countQuery.session(session);
  const actualCount = await countQuery;

  // Atomically update tenant's currentSeatCount to match real document count if missing or mismatched
  const updateQuery = Tenant.updateOne(
    {
      _id: tenantId,
      $or: [
        { currentSeatCount: { $exists: false } },
        { currentSeatCount: null },
        { currentSeatCount: { $ne: actualCount } },
      ],
    },
    {
      $set: { currentSeatCount: actualCount },
    },
  );
  if (session) updateQuery.session(session);
  await updateQuery;

  return actualCount;
}
