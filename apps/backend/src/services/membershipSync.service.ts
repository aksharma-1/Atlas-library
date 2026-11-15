import { Membership } from '../models/Membership';
import { getStartOfTodayIST } from '../utils/date';
import type { Types } from 'mongoose';

/**
 * Automatically updates memberships whose validity period has fully concluded from 'active' to 'expired'.
 *
 * TIMEZONE & BACKWARD-COMPATIBILITY RULES:
 * 1. Under Indian Standard Time (IST), any membership ending today (e.g. 15 November) must remain
 *    active throughout the entire calendar day in IST.
 * 2. A membership can only be marked 'expired' if:
 *    - Its stored `endDate` has already passed in real-time (`endDate < now`), AND
 *    - Its stored `endDate` is strictly before the beginning of the current calendar day in IST (`endDate < startOfTodayIST`).
 *    This dual-guard completely protects:
 *    a) New records normalized to 23:59:59.999 IST
 *    b) Legacy records normalized to 23:59:59.999 UTC
 *    c) Any partial/unnormalized timestamps created during the day
 */
export async function syncExpiredMemberships(tenantId?: Types.ObjectId | string): Promise<number> {
  try {
    const now = new Date();
    const startOfTodayIST = getStartOfTodayIST(now);

    // Expire ONLY if the membership ended before the start of today in IST
    // AND has passed real-time `now`.
    const filter: Record<string, unknown> = {
      status: 'active',
      endDate: { $lt: startOfTodayIST },
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
