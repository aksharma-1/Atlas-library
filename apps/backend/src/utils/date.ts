/**
 * Utilities for consistent date parsing and boundary handling across
 * membership assignments, renewals, and expiry synchronization.
 *
 * TIMEZONE POLICY:
 * StudyOS operates primarily in Indian Standard Time (IST = UTC+05:30).
 * Calendar days for membership start and end are anchored to IST:
 * - A date 'YYYY-MM-DD' starts at 00:00:00.000 IST (which is YYYY-MM-(DD-1) 18:30:00.000 UTC)
 * - A date 'YYYY-MM-DD' ends at 23:59:59.999 IST (which is YYYY-MM-DD 18:29:59.999 UTC)
 *
 * To ensure complete backward compatibility with existing stored records:
 * - Legacy records were stored with endDate ending at 23:59:59.999 UTC.
 * - Under IST, 23:59:59.999 UTC actually extends into 05:29:59.999 IST of the next morning.
 * - A membership is genuinely expired ONLY when the current wall-clock time has completely passed
 *   the membership's `endDate` AND the membership's calendar day in IST has ended.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30

/**
 * Returns a Date representing the exact start (00:00:00.000 IST) of the current day in IST.
 */
export function getStartOfTodayIST(referenceDate: Date = new Date()): Date {
  // Convert referenceDate to IST timestamp
  const istTime = referenceDate.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istTime);
  
  const y = istDate.getUTCFullYear();
  const m = istDate.getUTCMonth();
  const d = istDate.getUTCDate();

  // 00:00:00.000 in IST is (00:00:00.000 - 5h30m) UTC
  return new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - IST_OFFSET_MS);
}

/**
 * Parses start and end date inputs into robust Date objects with standard day boundaries.
 *
 * For date strings in YYYY-MM-DD format:
 * - startDate is anchored to the beginning of that calendar day in IST (00:00:00.000 IST)
 * - endDate is anchored to the end of that calendar day in IST (23:59:59.999 IST)
 *
 * This guarantees that a membership created or renewed for 15 November remains valid
 * throughout every second of 15 November in India.
 */
export function normalizeDateBoundaries(
  startDateInput: string | Date,
  endDateInput: string | Date,
): { startDate: Date; endDate: Date } {
  let startDate = new Date(startDateInput);
  let endDate = new Date(endDateInput);

  if (typeof startDateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(startDateInput.trim())) {
    const [y, m, d] = startDateInput.trim().split('-').map(Number);
    // 00:00:00.000 IST
    startDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - IST_OFFSET_MS);
  }

  if (typeof endDateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(endDateInput.trim())) {
    const [y, m, d] = endDateInput.trim().split('-').map(Number);
    // 23:59:59.999 IST
    endDate = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - IST_OFFSET_MS);
  }

  return { startDate, endDate };
}
