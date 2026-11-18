import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Student } from '../models/Student';
import { Membership } from '../models/Membership';
import { Payment } from '../models/Payment';
import { Plan } from '../models/Plan';
import { Seat } from '../models/Seat';
import { getNextReceiptNumber } from '../models/Counter';
import { normalizeDateBoundaries } from '../utils/date';

const registerStudentSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  gender: z.enum(['male', 'female', 'other']).optional(),
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
  paymentDate: z.string().optional(),
  transactionRef: z.string().optional(),
  paymentNotes: z.string().optional(),
});

export async function listStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.user!.tenantId!;
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

    const students = await Student.find(query).sort({ createdAt: -1 }).lean();
    
    // Attach latest active membership summary including seat info
    const studentIds = students.map((s) => s._id);
    const memberships = await Membership.find({
      tenantId,
      studentId: { $in: studentIds },
      status: { $ne: 'left' },
    })
      .populate('seatId', 'seatNumber')
      .populate('planId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const membershipMap = new Map<string, any>();
    for (const m of memberships) {
      const sId = m.studentId.toString();
      if (!membershipMap.has(sId)) {
        membershipMap.set(sId, m);
      }
    }

    const studentsWithMembership = students.map((s) => {
      const activeM = membershipMap.get(s._id.toString());
      return {
        ...s,
        currentSeat: activeM?.seatId?.seatNumber || null,
        seatId: activeM?.seatId?._id?.toString() || (activeM?.seatId ? activeM.seatId.toString() : null),
        planId: activeM?.planId?._id?.toString() || (activeM?.planId ? activeM.planId.toString() : null),
        shiftId: activeM?.shiftId?._id?.toString() || (activeM?.shiftId ? activeM.shiftId.toString() : null),
        startDate: activeM?.startDate ? activeM.startDate.toISOString() : null,
        endDate: activeM?.endDate ? activeM.endDate.toISOString() : null,
        seatType: activeM?.seatType || null,
        membershipStatus: activeM?.status || null,
        hasSeat: Boolean(activeM?.seatId),
      };
    });

    res.status(200).json({ students: studentsWithMembership });
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

    const tenantId = req.user!.tenantId!;

    // Generate unique membership number if not provided (e.g., ATL-0001)
    let membershipNumber = parsed.data.membershipNumber?.trim();
    if (!membershipNumber) {
      const count = await Student.countDocuments({ tenantId });
      membershipNumber = `MEM-${String(count + 1).padStart(4, '0')}`;
    } else {
      // Validate that manual membership number does not already exist for this tenant
      const existing = await Student.findOne({ tenantId, membershipNumber });
      if (existing) {
        res.status(409).json({
          error: `Membership ID "${membershipNumber}" is already assigned to ${existing.name}. Please enter a unique ID or leave blank to auto-generate.`,
        });
        return;
      }
    }

    const student = await Student.create({
      tenantId,
      name: parsed.data.name,
      gender: parsed.data.gender,
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
        const rawStart = parsed.data.startDate || now;
        const rawEnd = parsed.data.endDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const { startDate: start, endDate: end } = normalizeDateBoundaries(rawStart, rawEnd);

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

          // Atomically generate collision-proof receipt number
          const receiptNumber = await getNextReceiptNumber(tenantId);

          await Payment.create({
            tenantId,
            membershipId: createdMembership._id,
            studentId: student._id,
            studentName: student.name,
            membershipNumber: student.membershipNumber,
            receiptNumber,
            amountPaise: initialPaymentPaise,
            paymentMethod: parsed.data.paymentMethod || 'cash',
            paymentDate: parsed.data.paymentDate ? new Date(parsed.data.paymentDate) : new Date(),
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
    const tenantId = req.user!.tenantId!;

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

    // Priority 1: explicitly active membership
    // Priority 2: latest membership that is not left or cancelled (e.g. expired or grace period)
    const rawActiveMembership =
      memberships.find((m) => m.status === 'active') ||
      memberships.find((m) => m.status !== 'left' && m.status !== 'cancelled');
    
    // Flatten populated fields (seatNumber, planName, shiftName, shift hours) onto activeMembership for reliable client display
    let activeMembership: Record<string, unknown> | undefined = undefined;
    if (rawActiveMembership) {
      const mObj = (rawActiveMembership.toObject ? rawActiveMembership.toObject() : rawActiveMembership) as Record<string, any>;
      const seatObj = mObj.seatId as { _id?: string; seatNumber?: string } | undefined;
      const planObj = mObj.planId as { _id?: string; name?: string; feePaise?: number } | undefined;
      const shiftObj = mObj.shiftId as { _id?: string; name?: string; startTime?: string; endTime?: string } | undefined;

      activeMembership = {
        ...mObj,
        seatNumber: seatObj?.seatNumber || mObj['seatNumber'],
        planName: planObj?.name || mObj['planName'],
        shiftName: shiftObj?.name || mObj['shiftName'],
        shiftStartTime: shiftObj?.startTime,
        shiftEndTime: shiftObj?.endTime,
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
  gender: z.enum(['male', 'female', 'other']).optional(),
  mobile: z.string().min(10, 'Valid mobile number is required').trim().optional(),
  email: z.string().email().optional().or(z.literal('')),
  membershipNumber: z.string().optional(),
  address: z.string().optional(),
  photoUrl: z.string().optional(),
  // Optional active membership updates (plan, shift, seat, dates)
  planId: z.string().optional(),
  shiftId: z.string().optional(),
  seatId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  discountPaise: z.number().int().min(0).optional(),
  discountReason: z.string().optional(),
  customFeePaise: z.number().int().min(0).optional(),
});

export async function updateStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId!;

    const parsed = updateStudentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    if (parsed.data.membershipNumber) {
      const trimmed = parsed.data.membershipNumber.trim();
      const existing = await Student.findOne({
        tenantId,
        membershipNumber: trimmed,
        _id: { $ne: id },
      });
      if (existing) {
        res.status(409).json({
          error: `Membership ID "${trimmed}" is already assigned to ${existing.name}.`,
        });
        return;
      }
    }

    const {
      planId,
      shiftId,
      seatId,
      startDate: rawStartDate,
      endDate: rawEndDate,
      discountPaise,
      discountReason,
      customFeePaise,
      ...studentPersonalFields
    } = parsed.data;

    const student = await Student.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: studentPersonalFields },
      { new: true, runValidators: true },
    );

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // If membership fields are provided (planId, seatId, dates, etc.), update or create active membership
    if (planId) {
      const plan = await Plan.findOne({ _id: planId, tenantId });
      if (!plan) {
        res.status(404).json({ error: 'Selected plan not found' });
        return;
      }

      // Find current active membership for this student
      const activeMembership = await Membership.findOne({
        tenantId,
        studentId: id,
        status: { $in: ['active', 'expired'] },
      }).sort({ createdAt: -1 });

      const today = new Date();
      const defaultStart = activeMembership?.startDate || today;
      const defaultEnd = activeMembership?.endDate || new Date(defaultStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      const startDateVal = rawStartDate ? new Date(rawStartDate) : defaultStart;
      const endDateVal = rawEndDate ? new Date(rawEndDate) : defaultEnd;
      const { startDate, endDate } = normalizeDateBoundaries(startDateVal, endDateVal);

      // Check seat if reserved
      if (plan.seatType === 'reserved') {
        if (!seatId) {
          res.status(400).json({ error: 'A reserved plan requires an assigned desk' });
          return;
        }

        const seat = await Seat.findOne({ _id: seatId, tenantId });
        if (!seat) {
          res.status(404).json({ error: 'Desk not found' });
          return;
        }
        if (seat.status === 'maintenance' || seat.status === 'blocked') {
          res.status(400).json({ error: `Seat ${seat.seatNumber} is currently under maintenance or blocked` });
          return;
        }

        // Check for seat conflict with other students
        const shiftCondition: Record<string, unknown> = {};
        if (shiftId) {
          shiftCondition['$or'] = [
            { shiftId: shiftId },
            { shiftId: null },
            { shiftId: { $exists: false } },
          ];
        }

        const conflict = await Membership.findOne({
          tenantId,
          seatId,
          studentId: { $ne: id },
          status: { $in: ['active', 'expired'] },
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
          ...shiftCondition,
        });

        if (conflict) {
          res.status(409).json({
            error: `Seat ${seat.seatNumber} is already reserved for another student during this period`,
          });
          return;
        }
      }

      // Calculate fee
      const originalFee = plan.feePaise;
      let finalFee = originalFee;
      let appliedDiscount = 0;

      if (typeof customFeePaise === 'number' && customFeePaise >= 0) {
        finalFee = customFeePaise;
        appliedDiscount = Math.max(0, originalFee - customFeePaise);
      } else if (typeof discountPaise === 'number' && discountPaise > 0) {
        appliedDiscount = Math.min(discountPaise, originalFee);
        finalFee = Math.max(0, originalFee - appliedDiscount);
      }

      if (activeMembership) {
        // Free previous seat if seat changed
        if (activeMembership.seatId && activeMembership.seatId.toString() !== seatId) {
          const othersOnOldSeat = await Membership.countDocuments({
            tenantId,
            seatId: activeMembership.seatId,
            _id: { $ne: activeMembership._id },
            status: 'active',
            endDate: { $gte: new Date() },
          });
          if (othersOnOldSeat === 0) {
            await Seat.findByIdAndUpdate(activeMembership.seatId, { status: 'available' });
          }
        }

        activeMembership.planId = plan._id;
        activeMembership.shiftId = shiftId ? (shiftId as any) : undefined;
        activeMembership.seatId = plan.seatType === 'reserved' && seatId ? (seatId as any) : undefined;
        activeMembership.seatType = plan.seatType;
        activeMembership.startDate = startDate;
        activeMembership.endDate = endDate;
        if (discountPaise !== undefined || customFeePaise !== undefined) {
          activeMembership.feePaise = finalFee;
          activeMembership.originalFeePaise = originalFee;
          activeMembership.discountPaise = appliedDiscount;
          if (discountReason !== undefined) activeMembership.discountReason = discountReason;
        }
        activeMembership.status = endDate >= new Date() ? 'active' : 'expired';
        await activeMembership.save();

        if (plan.seatType === 'reserved' && seatId) {
          await Seat.findByIdAndUpdate(seatId, { status: 'occupied' });
        }
      } else {
        // Create new membership if none existed
        await Membership.create({
          tenantId,
          studentId: id,
          planId: plan._id,
          shiftId: shiftId || undefined,
          seatId: plan.seatType === 'reserved' ? seatId : undefined,
          seatType: plan.seatType,
          startDate,
          endDate,
          status: 'active',
          originalFeePaise: originalFee,
          discountPaise: appliedDiscount,
          discountReason,
          feePaise: finalFee,
          paidPaise: 0,
          paymentStatus: 'pending',
        });

        if (plan.seatType === 'reserved' && seatId) {
          await Seat.findByIdAndUpdate(seatId, { status: 'occupied' });
        }
      }
    }

    res.status(200).json({ student });
  } catch (err) {
    next(err);
  }
}

export async function deleteStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId!;

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

    // Backfill any historical payment records for this student with their name & membership number
    // before deleting the student document, ensuring revenue ledger permanently retains their identity.
    await Payment.updateMany(
      { studentId: id, tenantId },
      {
        $set: {
          studentName: student.name,
          membershipNumber: student.membershipNumber,
        },
      },
    );

    // Delete student
    await Student.deleteOne({ _id: id, tenantId });

    res.status(200).json({ message: 'Student and related active memberships successfully removed' });
  } catch (err) {
    next(err);
  }
}

