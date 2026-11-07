import type { Request, Response, NextFunction } from 'express';
import { Seat } from '../models/Seat';
import { Plan } from '../models/Plan';
import { Shift } from '../models/Shift';
import { Student } from '../models/Student';
import { Membership } from '../models/Membership';

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const threeDaysLater = new Date(startOfToday.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysLater = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [seats, plansCount, shiftsCount, studentsCount, memberships, expiredCount, expiring3Count, expiring7Count] = await Promise.all([
      Seat.find({ tenantId }).select('status'),
      Plan.countDocuments({ tenantId, isActive: true }),
      Shift.countDocuments({ tenantId, isActive: true }),
      Student.countDocuments({ tenantId }),
      Membership.find({ tenantId, status: 'active' }).select('feePaise paidPaise'),
      Membership.countDocuments({
        tenantId,
        $or: [
          { status: 'expired' },
          { status: 'active', endDate: { $lt: startOfToday } },
        ],
      }),
      Membership.countDocuments({
        tenantId,
        status: 'active',
        endDate: { $gte: startOfToday, $lte: threeDaysLater },
      }),
      Membership.countDocuments({
        tenantId,
        status: 'active',
        endDate: { $gte: startOfToday, $lte: sevenDaysLater },
      }),
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
      },
    });
  } catch (err) {
    next(err);
  }
}
