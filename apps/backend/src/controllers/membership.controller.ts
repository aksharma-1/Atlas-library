import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Membership } from '../models/Membership';
import { Plan } from '../models/Plan';
import { Seat } from '../models/Seat';

const createMembershipSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  shiftId: z.string().optional(),
  seatId: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

export async function createMembership(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createMembershipSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const tenantId = req.user!.tenantId;
    const { studentId, planId, shiftId, seatId, startDate, endDate } = parsed.data;

    const plan = await Plan.findOne({ _id: planId, tenantId });
    if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }

    // ── Conflict Prevention for Reserved Seats ───────────────────────────────
    if (plan.seatType === 'reserved') {
      if (!seatId) {
        res.status(400).json({ error: 'A reserved plan requires an assigned seat' });
        return;
      }

      // Check if seat belongs to tenant and is not in maintenance
      const seat = await Seat.findOne({ _id: seatId, tenantId });
      if (!seat) {
        res.status(404).json({ error: 'Seat not found' });
        return;
      }
      if (seat.status === 'maintenance' || seat.status === 'blocked') {
        res.status(400).json({ error: `Seat ${seat.seatNumber} is currently under maintenance or blocked` });
        return;
      }

      // Check for overlapping active memberships on this seat
      const conflictingMembership = await Membership.findOne({
        tenantId,
        seatId,
        status: 'active',
        $or: [
          { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } },
        ],
      });

      if (conflictingMembership) {
        res.status(409).json({
          error: `Seat ${seat.seatNumber} is already reserved by another active membership for this period`,
        });
        return;
      }

      // Mark seat occupied
      await Seat.findByIdAndUpdate(seatId, { status: 'occupied' });
    }

    // Terminate/Expire any existing active membership for this student
    await Membership.updateMany(
      { tenantId, studentId, status: 'active' },
      { $set: { status: 'expired' } },
    );

    const membership = await Membership.create({
      tenantId,
      studentId,
      planId,
      shiftId: shiftId || undefined,
      seatId: seatId || undefined,
      seatType: plan.seatType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'active',
      feePaise: plan.feePaise,
      paidPaise: 0,
      paymentStatus: 'pending',
    });

    res.status(201).json({ membership });
  } catch (err) {
    next(err);
  }
}
