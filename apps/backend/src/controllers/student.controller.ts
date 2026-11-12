import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Student } from '../models/Student';
import { Membership } from '../models/Membership';
import { Payment } from '../models/Payment';
import { Plan } from '../models/Plan';
import { Seat } from '../models/Seat';

const registerStudentSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  mobile: z.string().min(10, 'Valid mobile number is required').trim(),
  email: z.string().email().optional().or(z.literal('')),
  membershipNumber: z.string().optional(),
  address: z.string().optional(),
  photoUrl: z.string().optional(),
  // Optional instant seat & membership assignment fields
  planId: z.string().optional(),
  shiftId: z.string().optional(),
  seatId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  discountPaise: z.number().int().min(0).optional(),
  discountReason: z.string().optional(),
  customFeePaise: z.number().int().min(0).optional(),
  // Optional instant payment collection at registration
  initialPaymentAmountPaise: z.number().int().min(0).optional(),
  paymentMethod: z.enum(['cash', 'upi', 'card', 'bank_transfer']).optional(),
  transactionRef: z.string().optional(),
  paymentNotes: z.string().optional(),
});

export async function listStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { search } = req.query;

    const query: Record<string, unknown> = { tenantId };

    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query['$or'] = [
        { name: searchRegex },
        { mobile: searchRegex },
        { membershipNumber: searchRegex },
      ];
    }

    const students = await Student.find(query).sort({ createdAt: -1 });
    res.status(200).json({ students });
  } catch (err) {
    next(err);
  }
}

export async function createStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = registerStudentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const tenantId = req.user!.tenantId;

    // Generate unique membership number if not provided (e.g., ATL-0001)
    let membershipNumber = parsed.data.membershipNumber?.trim();
    if (!membershipNumber) {
      const count = await Student.countDocuments({ tenantId });
      membershipNumber = `MEM-${String(count + 1).padStart(4, '0')}`;
    }

    const student = await Student.create({
      tenantId,
      name: parsed.data.name,
      mobile: parsed.data.mobile,
      email: parsed.data.email || undefined,
      membershipNumber,
      address: parsed.data.address,
      photoUrl: parsed.data.photoUrl,
    });

    let createdMembership = null;

    // If planId was provided, immediately allocate the seat & activate membership
    if (parsed.data.planId) {
      const plan = await Plan.findOne({ _id: parsed.data.planId, tenantId });
      if (plan) {
        let seatId = parsed.data.seatId;

        // If reserved plan, validate seat
        if (plan.seatType === 'reserved') {
          if (!seatId) {
            res.status(400).json({ error: 'A reserved plan requires an assigned desk' });
            return;
          }
          const seat = await Seat.findOne({ _id: seatId, tenantId });
          if (!seat) {
            res.status(404).json({ error: 'Assigned desk not found' });
            return;
          }
          if (seat.status === 'maintenance' || seat.status === 'blocked') {
            res.status(400).json({ error: `Desk ${seat.seatNumber} is under maintenance or blocked` });
            return;
          }

          // Mark seat as occupied
          await Seat.findByIdAndUpdate(seatId, { status: 'occupied' });
        }

        const now = new Date();
        const start = parsed.data.startDate ? new Date(parsed.data.startDate) : now;
        const end = parsed.data.endDate
          ? new Date(parsed.data.endDate)
          : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Determine final fee with discount / custom fee negotiation
        const originalFee = plan.feePaise;
        let finalFee = originalFee;
        let appliedDiscount = 0;

        if (typeof parsed.data.customFeePaise === 'number' && parsed.data.customFeePaise >= 0) {
          finalFee = parsed.data.customFeePaise;
          appliedDiscount = Math.max(0, originalFee - parsed.data.customFeePaise);
        } else if (parsed.data.discountPaise && parsed.data.discountPaise > 0) {
          appliedDiscount = Math.min(parsed.data.discountPaise, originalFee);
          finalFee = Math.max(0, originalFee - appliedDiscount);
        }

        createdMembership = await Membership.create({
          tenantId,
          studentId: student._id,
          planId: plan._id,
          shiftId: parsed.data.shiftId || undefined,
          seatId: plan.seatType === 'reserved' ? seatId : undefined,
          seatType: plan.seatType,
          startDate: start,
          endDate: end,
          status: 'active',
          feePaise: finalFee,
          originalFeePaise: originalFee,
          discountPaise: appliedDiscount,
          discountReason: appliedDiscount > 0 ? (parsed.data.discountReason || 'Discount / Special offer') : undefined,
          paidPaise: 0,
          paymentStatus: 'pending',
        });

        // If initial payment was collected at registration, record it immediately
        let initialPaymentPaise = parsed.data.initialPaymentAmountPaise || 0;
        if (initialPaymentPaise > 0) {
          // Guard against paying more than the final negotiated membership fee
          if (initialPaymentPaise > finalFee) {
            initialPaymentPaise = finalFee;
          }

          const paymentCount = await Payment.countDocuments({ tenantId });
          const receiptNumber = `REC-${new Date().getFullYear()}-${String(paymentCount + 1).padStart(4, '0')}`;

          await Payment.create({
            tenantId,
            membershipId: createdMembership._id,
            studentId: student._id,
            receiptNumber,
            amountPaise: initialPaymentPaise,
            paymentMethod: parsed.data.paymentMethod || 'cash',
            transactionRef: parsed.data.transactionRef || undefined,
            notes: parsed.data.paymentNotes || 'Collected at registration',
          });

          const newPaid = initialPaymentPaise;
          const newStatus = newPaid >= finalFee ? 'paid' : 'partial';
          createdMembership.paidPaise = newPaid;
          createdMembership.paymentStatus = newStatus;
          await createdMembership.save();
        }
      }
    }

    res.status(201).json({ student, membership: createdMembership });
  } catch (err) {
    next(err);
  }
}

export async function getStudentProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    const student = await Student.findOne({ _id: id, tenantId });
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const [memberships, payments] = await Promise.all([
      Membership.find({ studentId: id, tenantId })
        .populate('planId', 'name feePaise')
        .populate('shiftId', 'name startTime endTime')
        .populate('seatId', 'seatNumber')
        .sort({ createdAt: -1 }),
      Payment.find({ studentId: id, tenantId }).sort({ createdAt: -1 }),
    ]);

    const rawActiveMembership = memberships.find((m) => m.status === 'active');
    
    // Flatten populated fields (seatNumber, planName, shiftName) onto activeMembership for reliable client display
    let activeMembership: Record<string, unknown> | undefined = undefined;
    if (rawActiveMembership) {
      const mObj = (rawActiveMembership.toObject ? rawActiveMembership.toObject() : rawActiveMembership) as Record<string, any>;
      const seatObj = mObj.seatId as { _id?: string; seatNumber?: string } | undefined;
      const planObj = mObj.planId as { _id?: string; name?: string; feePaise?: number } | undefined;
      const shiftObj = mObj.shiftId as { _id?: string; name?: string } | undefined;

      activeMembership = {
        ...mObj,
        seatNumber: seatObj?.seatNumber || mObj['seatNumber'],
        planName: planObj?.name || mObj['planName'],
        shiftName: shiftObj?.name || mObj['shiftName'],
      };
    }

    res.status(200).json({
      student,
      activeMembership,
      membershipHistory: memberships,
      payments,
    });
  } catch (err) {
    next(err);
  }
}

const updateStudentSchema = z.object({
  name: z.string().min(1, 'Name is required').trim().optional(),
  mobile: z.string().min(10, 'Valid mobile number is required').trim().optional(),
  email: z.string().email().optional().or(z.literal('')),
  membershipNumber: z.string().optional(),
  address: z.string().optional(),
  photoUrl: z.string().optional(),
});

export async function updateStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    const parsed = updateStudentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const student = await Student.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: parsed.data },
      { new: true, runValidators: true },
    );

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    res.status(200).json({ student });
  } catch (err) {
    next(err);
  }
}

export async function deleteStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    const student = await Student.findOne({ _id: id, tenantId });
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Find active memberships and free occupied seats
    const activeMemberships = await Membership.find({ studentId: id, tenantId, status: 'active' });
    const { Seat } = await import('../models/Seat');
    for (const m of activeMemberships) {
      if (m.seatId) {
        await Seat.findByIdAndUpdate(m.seatId, { status: 'available' });
      }
      m.status = 'cancelled';
      await m.save();
    }

    // Delete student
    await Student.deleteOne({ _id: id, tenantId });

    res.status(200).json({ message: 'Student and related active memberships successfully removed' });
  } catch (err) {
    next(err);
  }
}

