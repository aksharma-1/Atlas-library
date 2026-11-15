import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Seat } from '../models/Seat';
import { Tenant } from '../models/Tenant';
import { Membership } from '../models/Membership';
import { withTransaction } from '../utils/transaction';
import { ensureTenantSeatCountInitialized } from '../services/seatQuota.service';
import type { SeatDTO, SeatStudentInfo } from '@atlas/shared';

const bulkCreateSeatsSchema = z.object({
  prefix: z.string().optional().default(''),
  startNumber: z.number().int().min(1),
  endNumber: z.number().int().min(1),
  section: z.string().optional().default('Main Hall'),
}).refine(data => data.endNumber >= data.startNumber, {
  message: 'endNumber must be greater than or equal to startNumber',
  path: ['endNumber'],
});

const updateSeatStatusSchema = z.object({
  status: z.enum(['available', 'occupied', 'maintenance', 'blocked']),
});

const createSingleSeatSchema = z.object({
  seatNumber: z.string().min(1, 'Seat number is required').trim(),
  section: z.string().optional().default('Main Hall').transform((s) => s.trim() || 'Main Hall'),
});

const updateSeatSchema = z.object({
  seatNumber: z.string().min(1, 'Seat number is required').trim().optional(),
  section: z.string().min(1, 'Section name is required').trim().optional(),
  status: z.enum(['available', 'occupied', 'maintenance', 'blocked']).optional(),
});

const changeSeatSchema = z.object({
  membershipId: z.string().min(1, 'membershipId is required'),
  targetSeatId: z.string().min(1, 'targetSeatId is required'),
});

export async function listSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { shiftId, section } = req.query as { shiftId?: string; section?: string };

    const seatFilter: Record<string, unknown> = { tenantId };
    if (section && section !== 'all') {
      seatFilter['section'] = section;
    }

    // Natural alphanumeric sorting with collation
    const rawSeats = await Seat.find(seatFilter)
      .collation({ locale: 'en', numericOrdering: true })
      .sort({ seatNumber: 1 });

    // Fetch active or expired (not yet vacated/left) memberships for this tenant to provide live occupancy & student details
    // A student keeps their desk until they are explicitly marked as left or their desk is vacated
    const occupyingMemberships = await Membership.find({
      tenantId,
      status: { $in: ['active', 'expired'] },
      seatId: { $ne: null },
    })
      .populate('studentId', 'name mobile photoUrl membershipNumber')
      .populate('planId', 'name')
      .populate('shiftId', 'name');

    // Group memberships by seatId
    const membershipsBySeatId = new Map<string, typeof occupyingMemberships>();
    for (const m of occupyingMemberships) {
      if (!m.seatId) continue;
      const sId = m.seatId.toString();
      const list = membershipsBySeatId.get(sId) || [];
      list.push(m);
      membershipsBySeatId.set(sId, list);
    }

    const now = new Date();

    const seats: SeatDTO[] = rawSeats.map((seat) => {
      const seatObj = seat.toObject();
      const seatIdStr = seat._id.toString();
      const seatMemberships = membershipsBySeatId.get(seatIdStr) || [];

      // Build shiftOccupants array
      const shiftOccupants: SeatDTO['shiftOccupants'] = [];
      for (const m of seatMemberships) {
        const student = m.studentId as unknown as { _id?: string; name?: string; mobile?: string; photoUrl?: string; membershipNumber?: string } | null;
        if (!student) continue;

        const duePaise = Math.max(0, (m.feePaise || 0) - (m.paidPaise || 0));
        const diffMs = new Date(m.endDate).getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        const studentInfo: SeatStudentInfo = {
          membershipId: m._id.toString(),
          studentId: (student._id || m.studentId).toString(),
          name: student.name || 'Unknown Student',
          mobile: student.mobile || '',
          photoUrl: student.photoUrl,
          membershipNumber: student.membershipNumber || '',
          planName: (m.planId as unknown as { name?: string })?.name,
          shiftName: (m.shiftId as unknown as { name?: string })?.name || 'All Day / General',
          startDate: m.startDate.toISOString(),
          endDate: m.endDate.toISOString(),
          daysRemaining,
          hasDues: duePaise > 0,
          duePaise,
        };

        const mShiftId = m.shiftId ? (m.shiftId as unknown as { _id?: string })._id?.toString() || m.shiftId.toString() : 'all';
        const mShiftName = (m.shiftId as unknown as { name?: string })?.name || 'All Day / General';

        shiftOccupants.push({
          shiftId: mShiftId,
          shiftName: mShiftName,
          student: studentInfo,
        });
      }

      // Determine status & primary occupant based on shiftId query
      let status = seat.status;
      let occupant: SeatStudentInfo | undefined = undefined;

      if (seat.status !== 'maintenance' && seat.status !== 'blocked') {
        if (shiftId && shiftId !== 'all') {
          // If a specific shift is queried, find occupant matching this shift or with full day (no shift specified)
          const match = shiftOccupants.find((so) => so.shiftId === shiftId || so.shiftId === 'all');
          if (match) {
            status = 'occupied';
            occupant = match.student;
          } else {
            status = 'available';
          }
        } else {
          // In "all shifts" view, if any active membership exists, show occupied with the first occupant
          if (shiftOccupants.length > 0) {
            status = 'occupied';
            occupant = shiftOccupants[0].student;
          } else {
            status = 'available';
          }
        }
      } else {
        // If seat is maintenance/blocked, occupant can still be shown if any
        if (shiftOccupants.length > 0) {
          occupant = shiftOccupants[0].student;
        }
      }

      return {
        _id: seatIdStr,
        tenantId: seat.tenantId.toString(),
        seatNumber: seat.seatNumber,
        section: seat.section,
        status,
        occupant,
        shiftOccupants: shiftOccupants.length > 0 ? shiftOccupants : undefined,
        createdAt: seatObj.createdAt?.toISOString?.() || new Date().toISOString(),
        updatedAt: seatObj.updatedAt?.toISOString?.() || new Date().toISOString(),
      };
    });

    res.status(200).json({ seats });
  } catch (err) {
    next(err);
  }
}

export async function changeSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const parsed = changeSeatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { membershipId, targetSeatId } = parsed.data;

    const membership = await Membership.findOne({ _id: membershipId, tenantId, status: 'active' });
    if (!membership) {
      res.status(404).json({ error: 'Active membership not found' });
      return;
    }

    const targetSeat = await Seat.findOne({ _id: targetSeatId, tenantId });
    if (!targetSeat) {
      res.status(404).json({ error: 'Target seat not found' });
      return;
    }

    if (targetSeat.status === 'maintenance' || targetSeat.status === 'blocked') {
      res.status(400).json({ error: `Target seat ${targetSeat.seatNumber} is under maintenance or blocked` });
      return;
    }

    // Check if target seat has overlapping reservation for the shift
    const shiftCondition: Record<string, unknown> = {};
    if (membership.shiftId) {
      shiftCondition['$or'] = [
        { shiftId: membership.shiftId },
        { shiftId: null },
        { shiftId: { $exists: false } },
      ];
    }

    const conflicting = await Membership.findOne({
      tenantId,
      seatId: targetSeatId,
      status: 'active',
      _id: { $ne: membership._id },
      startDate: { $lte: membership.endDate },
      endDate: { $gte: membership.startDate },
      ...shiftCondition,
    });

    if (conflicting) {
      res.status(409).json({ error: `Target seat ${targetSeat.seatNumber} is already occupied for this shift` });
      return;
    }

    const oldSeatId = membership.seatId;

    // Assign new seat to membership
    membership.seatId = targetSeat._id;
    await membership.save();

    // Mark target seat occupied
    await Seat.findByIdAndUpdate(targetSeat._id, { status: 'occupied' });

    // If old seat has no other active memberships, mark old seat available
    if (oldSeatId && oldSeatId.toString() !== targetSeatId) {
      const remainingOnOldSeat = await Membership.countDocuments({
        tenantId,
        seatId: oldSeatId,
        status: 'active',
        endDate: { $gte: new Date() },
      });
      if (remainingOnOldSeat === 0) {
        await Seat.findByIdAndUpdate(oldSeatId, { status: 'available' });
      }
    }

    res.status(200).json({
      message: `Seat successfully changed to ${targetSeat.seatNumber}`,
      membership,
    });
  } catch (err) {
    next(err);
  }
}

export async function bulkCreateSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = bulkCreateSeatsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { prefix, startNumber, endNumber, section } = parsed.data;
    const tenantId = req.user!.tenantId!;

    const requestedCount = endNumber - startNumber + 1;

    let insertedDocs: any[] = [];
    let duplicateNote: string | undefined;

    await withTransaction(async (session) => {
      // 1. Fetch current tenant and ensure seat counter is initialized
      const tenantQuery = Tenant.findById(tenantId);
      if (session) tenantQuery.session(session);
      const tenant = await tenantQuery;

      if (!tenant) {
        const err: any = new Error('Tenant not found');
        err.status = 404;
        throw err;
      }

      // Ensure counter is initialized from Seat collection if missing
      const currentSeatCount = await ensureTenantSeatCountInitialized(tenantId, session);
      const maxSeats = typeof tenant.maxSeats === 'number' ? tenant.maxSeats : 100;

      // Check if requested seats would exceed maxSeats quota
      if (currentSeatCount + requestedCount > maxSeats) {
        const err: any = new Error(
          `Cannot create ${requestedCount} seat(s). Limit is ${maxSeats} seats, and your library already has ${currentSeatCount} seat(s).`,
        );
        err.status = 403;
        err.currentSeatCount = currentSeatCount;
        err.maxSeats = maxSeats;
        throw err;
      }

      // Concurrency protection: atomic check & lock using currentSeatCount in Tenant document
      const lockOptions = session ? { session } : {};
      const lockedTenant = await Tenant.findOneAndUpdate(
        {
          _id: tenantId,
          $expr: {
            $lte: [{ $add: ['$currentSeatCount', requestedCount] }, '$maxSeats'],
          },
        },
        {
          $inc: { currentSeatCount: requestedCount },
        },
        { new: true, ...lockOptions },
      );

      if (!lockedTenant) {
        const err: any = new Error(
          `Cannot create ${requestedCount} seat(s). Limit is ${maxSeats} seats, and your library already has ${currentSeatCount} seat(s).`,
        );
        err.status = 403;
        err.currentSeatCount = currentSeatCount;
        err.maxSeats = maxSeats;
        throw err;
      }

      // 2. Prepare documents for insertion
      const seatDocs = [];
      for (let i = startNumber; i <= endNumber; i++) {
        seatDocs.push({
          tenantId,
          seatNumber: `${prefix}${i}`,
          section,
          status: 'available' as const,
        });
      }

      const insertOptions: any = { ordered: false };
      if (session) insertOptions.session = session;

      try {
        insertedDocs = (await Seat.insertMany(seatDocs, insertOptions)) as any;
        if (insertedDocs.length < requestedCount) {
          // Adjust for any duplicates skipped
          const skippedCount = requestedCount - insertedDocs.length;
          await Tenant.updateOne({ _id: tenantId }, { $inc: { currentSeatCount: -skippedCount } }, lockOptions);
        }
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'insertedDocs' in err) {
          const partial = err as { insertedDocs: unknown[] };
          insertedDocs = partial.insertedDocs as any[];
          duplicateNote = 'Some seats were skipped as duplicates';
          const skippedCount = requestedCount - insertedDocs.length;
          await Tenant.updateOne({ _id: tenantId }, { $inc: { currentSeatCount: -skippedCount } }, lockOptions);
        } else {
          // Revert currentSeatCount increment on fatal error if not in transaction
          if (!session) {
            await Tenant.updateOne({ _id: tenantId }, { $inc: { currentSeatCount: -requestedCount } });
          }
          throw err;
        }
      }
    });

    res.status(201).json({
      createdCount: insertedDocs.length,
      seats: insertedDocs,
      ...(duplicateNote ? { note: duplicateNote } : {}),
    });
  } catch (err: any) {
    if (err.status === 403) {
      res.status(403).json({
        error: err.message,
        currentSeatCount: err.currentSeatCount,
        maxSeats: err.maxSeats,
      });
      return;
    }
    if (err.status === 404) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function createSingleSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createSingleSeatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { seatNumber, section } = parsed.data;
    const tenantId = req.user!.tenantId!;

    let createdSeat: any;

    await withTransaction(async (session) => {
      // 1. Fetch current tenant and ensure seat counter is initialized
      const tenantQuery = Tenant.findById(tenantId);
      if (session) tenantQuery.session(session);
      const tenant = await tenantQuery;

      if (!tenant) {
        const err: any = new Error('Tenant not found');
        err.status = 404;
        throw err;
      }

      // Ensure counter is initialized from Seat collection if missing
      const currentSeatCount = await ensureTenantSeatCountInitialized(tenantId, session);
      const maxSeats = typeof tenant.maxSeats === 'number' ? tenant.maxSeats : 100;

      if (currentSeatCount + 1 > maxSeats) {
        const err: any = new Error(
          `Cannot create seat. Limit is ${maxSeats} seats, and your library already has ${currentSeatCount} seat(s).`,
        );
        err.status = 403;
        err.currentSeatCount = currentSeatCount;
        err.maxSeats = maxSeats;
        throw err;
      }

      // Check duplicate seatNumber within tenant
      const existingQuery = Seat.findOne({ tenantId, seatNumber });
      if (session) existingQuery.session(session);
      const existing = await existingQuery;

      if (existing) {
        const err: any = new Error(`Desk '${seatNumber}' already exists in your library`);
        err.status = 409;
        throw err;
      }

      // Concurrency protection: atomic check & lock using currentSeatCount in Tenant document
      const lockOptions = session ? { session } : {};
      const lockedTenant = await Tenant.findOneAndUpdate(
        {
          _id: tenantId,
          $expr: {
            $lte: [{ $add: ['$currentSeatCount', 1] }, '$maxSeats'],
          },
        },
        {
          $inc: { currentSeatCount: 1 },
        },
        { new: true, ...lockOptions },
      );

      if (!lockedTenant) {
        const err: any = new Error(
          `Cannot create seat. Limit is ${maxSeats} seats, and your library already has ${currentSeatCount} seat(s).`,
        );
        err.status = 403;
        err.currentSeatCount = currentSeatCount;
        err.maxSeats = maxSeats;
        throw err;
      }

      try {
        const createOptions = session ? { session } : {};
        const [seat] = await Seat.create(
          [
            {
              tenantId,
              seatNumber,
              section,
              status: 'available',
            },
          ],
          createOptions,
        );
        createdSeat = seat;
      } catch (insertErr) {
        if (!session) {
          await Tenant.updateOne({ _id: tenantId }, { $inc: { currentSeatCount: -1 } });
        }
        throw insertErr;
      }
    });

    res.status(201).json({ seat: createdSeat });
  } catch (err: any) {
    if (err.status === 403) {
      res.status(403).json({
        error: err.message,
        currentSeatCount: err.currentSeatCount,
        maxSeats: err.maxSeats,
      });
      return;
    }
    if (err.status === 409) {
      res.status(409).json({ error: err.message });
      return;
    }
    if (err.status === 404) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function updateSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = updateSeatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const tenantId = req.user!.tenantId;
    const { seatNumber, section, status } = parsed.data;

    // If changing seatNumber, check conflict
    if (seatNumber) {
      const existing = await Seat.findOne({ tenantId, seatNumber, _id: { $ne: id } });
      if (existing) {
        res.status(409).json({ error: `Desk '${seatNumber}' is already in use by another seat` });
        return;
      }
    }

    const updateFields: Record<string, unknown> = {};
    if (seatNumber) updateFields['seatNumber'] = seatNumber;
    if (section) updateFields['section'] = section;
    if (status) updateFields['status'] = status;

    const seat = await Seat.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updateFields },
      { new: true },
    );

    if (!seat) {
      res.status(404).json({ error: 'Seat not found' });
      return;
    }

    res.status(200).json({ seat });
  } catch (err) {
    next(err);
  }
}

export async function deleteSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId!;

    let deletedSeat: any;

    await withTransaction(async (session) => {
      // Ensure counter is initialized if missing
      await ensureTenantSeatCountInitialized(tenantId, session);

      // Prevent deletion if seat has active student membership
      const membershipQuery = Membership.findOne({
        tenantId,
        seatId: id,
        status: 'active',
        endDate: { $gte: new Date() },
      });
      if (session) membershipQuery.session(session);
      const active = await membershipQuery;

      if (active) {
        const err: any = new Error(
          'Cannot delete desk because a student currently has an active membership assigned to it. Vacate or relocate the student first.',
        );
        err.status = 400;
        throw err;
      }

      const deleteOptions = session ? { session } : {};
      const seat = await Seat.findOneAndDelete({ _id: id, tenantId }, deleteOptions);
      if (!seat) {
        const err: any = new Error('Seat not found');
        err.status = 404;
        throw err;
      }
      deletedSeat = seat;

      // Decrement tenant's currentSeatCount counter atomically inside transaction
      await Tenant.updateOne(
        { _id: tenantId },
        [
          {
            $set: {
              currentSeatCount: {
                $max: [0, { $subtract: [{ $ifNull: ['$currentSeatCount', 1] }, 1] }],
              },
            },
          },
        ],
        deleteOptions,
      );
    });

    res.status(200).json({ message: `Desk '${deletedSeat.seatNumber}' deleted successfully` });
  } catch (err: any) {
    if (err.status === 400) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err.status === 404) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function deleteSeatsBySection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { section } = req.query as { section?: string };
    const tenantId = req.user!.tenantId!;

    if (!section || section.trim() === '' || section === 'all') {
      res.status(400).json({ error: 'A valid section name is required to delete' });
      return;
    }

    let deletedCount = 0;

    await withTransaction(async (session) => {
      // Ensure counter is initialized if missing
      await ensureTenantSeatCountInitialized(tenantId, session);

      // Find all seats in this section
      const seatQuery = Seat.find({ tenantId, section });
      if (session) seatQuery.session(session);
      const seats = await seatQuery;
      const seatIds = seats.map((s) => s._id);

      // Check if any seat in this section has an active membership
      const membershipQuery = Membership.findOne({
        tenantId,
        seatId: { $in: seatIds },
        status: 'active',
        endDate: { $gte: new Date() },
      });
      if (session) membershipQuery.session(session);
      const active = await membershipQuery;

      if (active) {
        const err: any = new Error(
          `Cannot delete section '${section}' because one or more desks currently have active student memberships. Vacate or relocate them first.`,
        );
        err.status = 400;
        throw err;
      }

      const deleteOptions = session ? { session } : {};
      const result = await Seat.deleteMany({ tenantId, section }, deleteOptions);
      deletedCount = result.deletedCount;

      // Decrement tenant's currentSeatCount counter by deleted count atomically inside transaction
      if (result.deletedCount > 0) {
        await Tenant.updateOne(
          { _id: tenantId },
          [
            {
              $set: {
                currentSeatCount: {
                  $max: [0, { $subtract: [{ $ifNull: ['$currentSeatCount', 0] }, result.deletedCount] }],
                },
              },
            },
          ],
          deleteOptions,
        );
      }
    });

    res.status(200).json({
      message: `Successfully deleted ${deletedCount} desks from section '${section}'`,
      deletedCount,
    });
  } catch (err: any) {
    if (err.status === 400) {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function updateSeatStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = updateSeatStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const seat = await Seat.findOneAndUpdate(
      { _id: id, tenantId: req.user!.tenantId },
      { $set: { status: parsed.data.status } },
      { new: true },
    );

    if (!seat) {
      res.status(404).json({ error: 'Seat not found' });
      return;
    }

    res.status(200).json({ seat });
  } catch (err) {
    next(err);
  }
}
