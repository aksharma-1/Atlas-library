import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Student } from '../models/Student';
import { Membership } from '../models/Membership';
import { Payment } from '../models/Payment';

const registerStudentSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  mobile: z.string().min(10, 'Valid mobile number is required').trim(),
  email: z.string().email().optional().or(z.literal('')),
  membershipNumber: z.string().optional(),
  address: z.string().optional(),
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
    });

    res.status(201).json({ student });
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

    const activeMembership = memberships.find((m) => m.status === 'active');

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
