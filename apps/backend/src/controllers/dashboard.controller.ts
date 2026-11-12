import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Seat } from '../models/Seat';
import { Plan } from '../models/Plan';
import { Shift } from '../models/Shift';
import { Student } from '../models/Student';
import { Membership } from '../models/Membership';
import { Payment } from '../models/Payment';
import type { RevenueStatsDTO } from '@atlas/shared';

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawTenantId = req.user!.tenantId!;
    const tenantObjectId = new Types.ObjectId(rawTenantId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const threeDaysLater = new Date(startOfToday.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysLater = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      seats,
      plansCount,
      shiftsCount,
      studentsCount,
      memberships,
      expiredCount,
      expiring3Count,
      expiring7Count,
      todayPayments,
      monthPayments,
    ] = await Promise.all([
      Seat.find({ tenantId: tenantObjectId }).select('status'),
      Plan.countDocuments({ tenantId: tenantObjectId, isActive: true }),
      Shift.countDocuments({ tenantId: tenantObjectId, isActive: true }),
      Student.countDocuments({ tenantId: tenantObjectId }),
      Membership.find({ tenantId: tenantObjectId, status: 'active' }).select('feePaise paidPaise'),
      Membership.countDocuments({
        tenantId: tenantObjectId,
        $or: [
          { status: 'expired' },
          { status: 'active', endDate: { $lt: startOfToday } },
        ],
      }),
      Membership.countDocuments({
        tenantId: tenantObjectId,
        status: 'active',
        endDate: { $gte: startOfToday, $lte: threeDaysLater },
      }),
      Membership.countDocuments({
        tenantId: tenantObjectId,
        status: 'active',
        endDate: { $gte: startOfToday, $lte: sevenDaysLater },
      }),
      Payment.aggregate([
        { $match: { tenantId: tenantObjectId, createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$amountPaise' } } },
      ]),
      Payment.aggregate([
        { $match: { tenantId: tenantObjectId, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amountPaise' } } },
      ]),
    ]);

    const totalSeats = seats.length;
    let availableSeats = 0;
    let occupiedSeats = 0;
    let maintenanceSeats = 0;

    for (const seat of seats) {
      if (seat.status === 'available') availableSeats++;
      else if (seat.status === 'occupied') occupiedSeats++;
      else if (seat.status === 'maintenance' || seat.status === 'blocked') maintenanceSeats++;
    }

    let duesOutstandingPaise = 0;
    let dueMembersCount = 0;
    for (const m of memberships) {
      if (m.feePaise > m.paidPaise) {
        duesOutstandingPaise += (m.feePaise - m.paidPaise);
        dueMembersCount++;
      }
    }

    const todayRevenuePaise = todayPayments[0]?.total || 0;
    const thisMonthRevenuePaise = monthPayments[0]?.total || 0;

    res.status(200).json({
      stats: {
        totalSeats,
        availableSeats,
        occupiedSeats,
        maintenanceSeats,
        totalPlans: plansCount,
        totalShifts: shiftsCount,
        totalStudents: studentsCount,
        duesOutstandingPaise,
        dueMembersCount,
        expiringIn3DaysCount: expiring3Count,
        expiringIn7DaysCount: expiring7Count,
        expiredCount,
        todayRevenuePaise,
        thisMonthRevenuePaise,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getRevenueStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawTenantId = req.user!.tenantId!;
    const tenantObjectId = new Types.ObjectId(rawTenantId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 14 days trend range
    const fourteenDaysAgo = new Date(startOfToday.getTime() - 13 * 24 * 60 * 60 * 1000);

    const [
      allPaymentsSummary,
      todaySummary,
      thisMonthSummary,
      lastMonthSummary,
      methodBreakdown,
      dailyTrendRaw,
      recentPayments,
      activeMemberships,
    ] = await Promise.all([
      // Total Revenue overall
      Payment.aggregate([
        { $match: { tenantId: tenantObjectId } },
        { $group: { _id: null, total: { $sum: '$amountPaise' }, count: { $sum: 1 } } },
      ]),
      // Today
      Payment.aggregate([
        { $match: { tenantId: tenantObjectId, createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$amountPaise' } } },
      ]),
      // This Month
      Payment.aggregate([
        { $match: { tenantId: tenantObjectId, createdAt: { $gte: startOfThisMonth } } },
        { $group: { _id: null, total: { $sum: '$amountPaise' } } },
      ]),
      // Last Month
      Payment.aggregate([
        { $match: { tenantId: tenantObjectId, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$amountPaise' } } },
      ]),
      // Breakdown by paymentMethod
      Payment.aggregate([
        { $match: { tenantId: tenantObjectId } },
        {
          $group: {
            _id: '$paymentMethod',
            total: { $sum: '$amountPaise' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Daily trend for the past 14 days
      Payment.aggregate([
        { $match: { tenantId: tenantObjectId, createdAt: { $gte: fourteenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            total: { $sum: '$amountPaise' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Recent transactions with student populate
      Payment.find({ tenantId: tenantObjectId })
        .sort({ createdAt: -1 })
        .limit(15)
        .populate<{ studentId: { name: string; membershipNumber?: string } }>('studentId', 'name membershipNumber'),
      // Active dues calculation
      Membership.find({ tenantId: tenantObjectId, status: 'active' }).select('feePaise paidPaise'),
    ]);

    const totalRevenuePaise = allPaymentsSummary[0]?.total || 0;
    const totalTransactionsCount = allPaymentsSummary[0]?.count || 0;
    const todayRevenuePaise = todaySummary[0]?.total || 0;
    const thisMonthRevenuePaise = thisMonthSummary[0]?.total || 0;
    const lastMonthRevenuePaise = lastMonthSummary[0]?.total || 0;

    let duesOutstandingPaise = 0;
    let dueStudentsCount = 0;
    for (const m of activeMemberships) {
      if (m.feePaise > m.paidPaise) {
        duesOutstandingPaise += (m.feePaise - m.paidPaise);
        dueStudentsCount++;
      }
    }

    const averagePaymentPaise = totalTransactionsCount > 0
      ? Math.round(totalRevenuePaise / totalTransactionsCount)
      : 0;

    // Fill missing days in the 14-day trends map
    const trendMap = new Map<string, { total: number; count: number }>();
    for (const d of dailyTrendRaw) {
      trendMap.set(d._id, { total: d.total, count: d.count });
    }

    const dailyTrends = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      const entry = trendMap.get(key) || { total: 0, count: 0 };

      dailyTrends.push({
        date: key,
        label: `${d.getDate()} ${monthNames[d.getMonth()]}`,
        amountPaise: entry.total,
        txnCount: entry.count,
      });
    }

    // Payment methods breakdown
    const methods: ('cash' | 'upi' | 'card' | 'bank_transfer')[] = ['upi', 'cash', 'card', 'bank_transfer'];
    const paymentMethodBreakdown = methods.map((m) => {
      const found = methodBreakdown.find((x) => x._id === m);
      const amountPaise = found ? found.total : 0;
      const count = found ? found.count : 0;
      const percentage = totalRevenuePaise > 0
        ? Math.round((amountPaise / totalRevenuePaise) * 100)
        : 0;
      return {
        method: m,
        amountPaise,
        count,
        percentage,
      };
    });

    const recentTransactions = recentPayments.map((p) => ({
      _id: p._id.toString(),
      receiptNumber: p.receiptNumber,
      studentName: p.studentId?.name || 'Unknown Student',
      membershipNumber: p.studentId?.membershipNumber || '—',
      amountPaise: p.amountPaise,
      paymentMethod: p.paymentMethod,
      transactionRef: p.transactionRef,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
    }));

    const responseData: RevenueStatsDTO = {
      totalRevenuePaise,
      todayRevenuePaise,
      thisMonthRevenuePaise,
      lastMonthRevenuePaise,
      duesOutstandingPaise,
      dueStudentsCount,
      totalTransactionsCount,
      averagePaymentPaise,
      paymentMethodBreakdown,
      dailyTrends,
      recentTransactions,
    };

    res.status(200).json({ stats: responseData });
  } catch (err) {
    next(err);
  }
}
