import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Membership } from '../models/Membership';
import { Plan } from '../models/Plan';
import { Seat } from '../models/Seat';
import { Student } from '../models/Student';
import { Shift } from '../models/Shift';
import { Payment } from '../models/Payment';
import { getNextReceiptNumber } from '../models/Counter';

import { syncExpiredMemberships } from '../services/membershipSync.service';

const createMembershipSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  shiftId: z.string().optional(),
  seatId: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  discountPaise: z.number().int().min(0).optional(),
  discountReason: z.string().optional(),
  customFeePaise: z.number().int().min(0).optional(),
  // Instant fee collection at renewal/assignment
  initialPaymentAmountPaise: z.number().int().min(0).optional(),
  paymentMethod: z.enum(['cash', 'upi', 'card', 'bank_transfer']).optional(),
  paymentDate: z.string().optional(),
  transactionRef: z.string().optional(),
  paymentNotes: z.string().optional(),
});

export async function createMembership(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createMembershipSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const tenantId = req.user!.tenantId;
    const { studentId, planId, shiftId, seatId, startDate, endDate, discountPaise = 0, discountReason, customFeePaise } = parsed.data;

    // Verify student belongs to this tenant
    const student = await Student.findOne({ _id: studentId, tenantId });
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const plan = await Plan.findOne({ _id: planId, tenantId });
    if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }

    if (shiftId) {
      const shift = await Shift.findOne({ _id: shiftId, tenantId });
      if (!shift) {
        res.status(404).json({ error: 'Shift not found' });
        return;
      }
    }

    // Determine final fee with discount / custom fee negotiation
    const originalFee = plan.feePaise;
    let finalFee = originalFee;
    let appliedDiscount = 0;

    if (typeof customFeePaise === 'number' && customFeePaise >= 0) {
      finalFee = customFeePaise;
      appliedDiscount = Math.max(0, originalFee - customFeePaise);
    } else if (discountPaise > 0) {
      appliedDiscount = Math.min(discountPaise, originalFee);
      finalFee = Math.max(0, originalFee - appliedDiscount);
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

      // Check for overlapping active memberships on this seat for the SAME shift (or all shifts if full day)
      // If student is renewing their own seat, exclude their own current active membership from conflict
      const shiftCondition: Record<string, unknown> = {};
      if (shiftId) {
        shiftCondition['$or'] = [
          { shiftId: shiftId },
          { shiftId: null },
          { shiftId: { $exists: false } },
        ];
      }

      const conflictingMembership = await Membership.findOne({
        tenantId,
        seatId,
        studentId: { $ne: studentId }, // Allow student to renew their own seat
        status: 'active',
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) },
        ...shiftCondition,
      });

      if (conflictingMembership) {
        res.status(409).json({
          error: `Seat ${seat.seatNumber} is already reserved for this shift during this period`,
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
      feePaise: finalFee,
      originalFeePaise: originalFee,
      discountPaise: appliedDiscount,
      discountReason: appliedDiscount > 0 ? (discountReason || 'Discount / Special offer') : undefined,
      paidPaise: 0,
      paymentStatus: 'pending',
    });

    // If initial payment was collected at renewal/assignment, record it immediately
    let initialPaymentPaise = parsed.data.initialPaymentAmountPaise || 0;
    if (initialPaymentPaise > 0) {
      if (initialPaymentPaise > finalFee) {
        initialPaymentPaise = finalFee;
      }

      const receiptNumber = await getNextReceiptNumber(tenantId!);

      await Payment.create({
        tenantId,
        membershipId: membership._id,
        studentId,
        receiptNumber,
        amountPaise: initialPaymentPaise,
        paymentMethod: parsed.data.paymentMethod || 'cash',
        paymentDate: parsed.data.paymentDate ? new Date(parsed.data.paymentDate) : new Date(),
        transactionRef: parsed.data.transactionRef || undefined,
        notes: parsed.data.paymentNotes || 'Collected at renewal',
      });

      const newPaid = initialPaymentPaise;
      const newStatus = newPaid >= finalFee ? 'paid' : 'partial';
      membership.paidPaise = newPaid;
      membership.paymentStatus = newStatus;
      await membership.save();
    }

    res.status(201).json({ membership });
  } catch (err) {
    next(err);
  }
}

export async function vacateSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    const membership = await Membership.findOne({ _id: id, tenantId });
    if (!membership) {
      res.status(404).json({ error: 'Membership not found' });
      return;
    }

    const oldSeatId = membership.seatId;

    // Unassign seat from membership but keep membership status active
    membership.seatId = undefined;
    membership.seatType = 'non-reserved';
    await membership.save();

    // Free the seat if reserved
    if (oldSeatId) {
      const remainingOnSeat = await Membership.countDocuments({
        tenantId,
        seatId: oldSeatId,
        status: 'active',
        endDate: { $gte: new Date() },
      });
      if (remainingOnSeat === 0) {
        await Seat.findByIdAndUpdate(oldSeatId, { status: 'available' });
      }
    }

    res.status(200).json({ message: 'Desk vacated successfully. Student membership remains active.', membership });
  } catch (err) {
    next(err);
  }
}

export async function markMembershipLeft(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    const membership = await Membership.findOne({ _id: id, tenantId });
    if (!membership) {
      res.status(404).json({ error: 'Membership not found' });
      return;
    }

    if (membership.status === 'left') {
      res.status(400).json({ error: 'Membership is already marked as left' });
      return;
    }

    // Free the seat if reserved
    if (membership.seatId) {
      await Seat.findByIdAndUpdate(membership.seatId, { status: 'available' });
    }

    membership.status = 'left';
    await membership.save();

    res.status(200).json({ message: 'Membership marked as left and seat released', membership });
  } catch (err) {
    next(err);
  }
}

export async function deleteMembership(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    const membership = await Membership.findOne({ _id: id, tenantId });
    if (!membership) {
      res.status(404).json({ error: 'Membership record not found' });
      return;
    }

    // Free the seat if it was reserved
    if (membership.seatId && membership.status === 'active') {
      const remaining = await Membership.countDocuments({
        tenantId,
        seatId: membership.seatId,
        _id: { $ne: membership._id },
        status: 'active',
        endDate: { $gte: new Date() },
      });
      if (remaining === 0) {
        await Seat.findByIdAndUpdate(membership.seatId, { status: 'available' });
      }
    }

    await Membership.deleteOne({ _id: id, tenantId });

    res.status(200).json({ message: 'Membership record deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function clearAllLeftMemberships(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;

    const result = await Membership.deleteMany({
      tenantId,
      status: 'left',
    });

    res.status(200).json({
      message: `Successfully cleared ${result.deletedCount} left membership records`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    next(err);
  }
}

const addGiftDaysSchema = z.object({
  days: z.number().int().min(1, 'Days must be at least 1'),
  reason: z.string().optional(),
});

export async function addGiftDays(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    const parsed = addGiftDaysSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const membership = await Membership.findOne({ _id: id, tenantId });
    if (!membership) {
      res.status(404).json({ error: 'Membership not found' });
      return;
    }

    // Calculate new end date by adding `days`
    const currentEnd = new Date(membership.endDate);
    // If already expired in the past, add from today or from currentEnd?
    // Standard logic: extend currentEnd by X days
    currentEnd.setDate(currentEnd.getDate() + parsed.data.days);
    membership.endDate = currentEnd;

    // If it was expired and extended into the future, reactivate if seat is free
    if (membership.status === 'expired' && currentEnd > new Date()) {
      membership.status = 'active';
      if (membership.seatId) {
        await Seat.findByIdAndUpdate(membership.seatId, { status: 'occupied' });
      }
    }

    await membership.save();

    res.status(200).json({
      message: `Successfully added ${parsed.data.days} gift days`,
      membership,
    });
  } catch (err) {
    next(err);
  }
}

export async function listMembershipsWithFilters(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { filter } = req.query;

    // Automatically synchronize any past-due memberships to 'expired' status
    await syncExpiredMemberships(tenantId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const query: Record<string, unknown> = { tenantId };

    if (filter === 'expired') {
      query['status'] = 'expired';
    } else if (filter === 'expiring_3') {
      const threeDaysLater = new Date(startOfToday.getTime() + 3 * 24 * 60 * 60 * 1000);
      query['status'] = 'active';
      query['endDate'] = { $gte: startOfToday, $lte: threeDaysLater };
    } else if (filter === 'expiring_7') {
      const sevenDaysLater = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
      query['status'] = 'active';
      query['endDate'] = { $gte: startOfToday, $lte: sevenDaysLater };
    } else if (filter === 'dues') {
      query['status'] = 'active';
      query['$expr'] = { $gt: ['$feePaise', '$paidPaise'] };
    } else if (filter === 'left') {
      query['status'] = 'left';
    } else if (filter === 'no_seat') {
      query['status'] = 'active';
      query['endDate'] = { $gte: startOfToday };
      query['$or'] = [
        { seatId: null },
        { seatId: { $exists: false } }
      ];
    } else if (filter === 'active') {
      query['status'] = 'active';
      query['endDate'] = { $gte: startOfToday };
    }

    const memberships = await Membership.find(query)
      .populate('studentId', 'name mobile email membershipNumber')
      .populate('planId', 'name feePaise')
      .populate('shiftId', 'name startTime endTime')
      .populate('seatId', 'seatNumber')
      .sort({ endDate: 1 });

    // Filter out orphaned memberships where student document no longer exists
    const validMemberships = memberships.filter((m) => m.studentId != null);

    res.status(200).json({ memberships: validMemberships });
  } catch (err) {
    next(err);
  }
}

