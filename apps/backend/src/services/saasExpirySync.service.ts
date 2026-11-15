import { Tenant } from '../models/Tenant';
import type { Types } from 'mongoose';

/**
 * Service: saasExpirySync
 *
 * Finds active SaaS tenants whose subscription expiration date (`subscriptionExpiresAt`)
 * has passed, and atomically transitions them to 'past_due'.
 *
 * Rules:
 * 1. Only transitions tenants where subscriptionStatus is 'active' AND subscriptionExpiresAt < now.
 * 2. Uses atomic updateMany with exact filter condition to prevent race conditions or duplicate transitions.
 * 3. Safe across multiple concurrent server startups or instances (multi-instance Render deployments).
 * 4. Preserves all library data (seats, students, memberships, configs, etc.).
 *
 * @param tenantId Optional specific tenantId to sync immediately on-demand
 * @returns Number of tenants transitioned to 'past_due'
 */
export async function syncExpiredSaasSubscriptions(tenantId?: Types.ObjectId | string): Promise<number> {
  try {
    const now = new Date();

    const filter: Record<string, unknown> = {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: { $exists: true, $ne: null, $lt: now },
    };

    if (tenantId) {
      filter._id = tenantId;
    }

    const result = await Tenant.updateMany(filter, {
      $set: { subscriptionStatus: 'past_due' },
    });

    const modifiedCount = result.modifiedCount || 0;
    if (modifiedCount > 0) {
      console.log(`⏰  Transitioned ${modifiedCount} expired SaaS subscription(s) to 'past_due'.`);
    }

    return modifiedCount;
  } catch (err) {
    console.error('Failed to sync expired SaaS subscriptions:', err);
    return 0;
  }
}
