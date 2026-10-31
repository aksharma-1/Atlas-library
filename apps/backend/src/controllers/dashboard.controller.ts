import type { Request, Response, NextFunction } from 'express';
import { Seat } from '../models/Seat';
import { Plan } from '../models/Plan';
import { Shift } from '../models/Shift';

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;

    const [seats, plansCount, shiftsCount] = await Promise.all([
      Seat.find({ tenantId }).select('status'),
      Plan.countDocuments({ tenantId, isActive: true }),
      Shift.countDocuments({ tenantId, isActive: true }),
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

    res.status(200).json({
      stats: {
        totalSeats,
        availableSeats,
        occupiedSeats,
        maintenanceSeats,
        totalPlans: plansCount,
        totalShifts: shiftsCount,
        totalStudents: 0, // Phase 4
        duesOutstandingPaise: 0, // Phase 4
      },
    });
  } catch (err) {
    next(err);
  }
}
