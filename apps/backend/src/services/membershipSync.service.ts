import { Membership } from '../models/Membership';
import type { Types } from 'mongoose';

/**
 * Automatically updates memberships whose endDate is strictly before the beginning of today
 * from 'active' to 'expired'.
 *
 * NOTE: As per business requirements:
 * - A student keeps their desk until they are explicitly marked as left or their desk is vacated.
 * - However, if a seat has NO active memberships left, its status or occupancy remains handled
 *   consistently by the seat allocation logic.
 */
export async function syncExpiredMemberships(tenantId?: Types.ObjectId | string): Promise<number> {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const filter: Record<string, unknown> = {
      status: 'active',
      endDate: { $lt: startOfToday },
    };

    if (tenantId) {
      filter.tenantId = tenantId;
    }

    const result = await Membership.updateMany(filter, {
      $set: { status: 'expired' },
    });

    return result.modifiedCount || 0;
  } catch (err) {
    console.error('Failed to sync expired memberships:', err);
    return 0;
  }
}
