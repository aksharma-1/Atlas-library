import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Seat } from '../models/Seat';

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

export async function listSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const seats = await Seat.find({ tenantId: req.user!.tenantId }).sort({ seatNumber: 1 });
    res.status(200).json({ seats });
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
    const tenantId = req.user!.tenantId;

    const seatDocs = [];
    for (let i = startNumber; i <= endNumber; i++) {
      seatDocs.push({
        tenantId,
        seatNumber: `${prefix}${i}`,
        section,
        status: 'available' as const,
      });
    }

    // Insert with ordered: false to skip duplicates if any exist
    try {
      const inserted = await Seat.insertMany(seatDocs, { ordered: false });
      res.status(201).json({ createdCount: inserted.length, seats: inserted });
    } catch (err: unknown) {
      // If bulk write error (e.g. some duplicate keys), handle gracefully
      if (err && typeof err === 'object' && 'insertedDocs' in err) {
        const partial = err as { insertedDocs: unknown[] };
        res.status(201).json({
          createdCount: partial.insertedDocs.length,
          seats: partial.insertedDocs,
          note: 'Some seats were skipped as duplicates',
        });
        return;
      }
      throw err;
    }
  } catch (err) {
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
