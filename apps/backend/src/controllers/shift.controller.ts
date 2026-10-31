import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Shift } from '../models/Shift';

const createShiftSchema = z.object({
  name: z.string().min(1, 'Shift name is required').trim(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm (24h)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm (24h)'),
  isActive: z.boolean().optional().default(true),
});

export async function listShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shifts = await Shift.find({ tenantId: req.user!.tenantId }).sort({ createdAt: 1 });
    res.status(200).json({ shifts });
  } catch (err) {
    next(err);
  }
}

export async function createShift(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createShiftSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const tenantId = req.user!.tenantId;
    const existing = await Shift.findOne({ tenantId, name: parsed.data.name });
    if (existing) {
      res.status(409).json({ error: `Shift with name "${parsed.data.name}" already exists` });
      return;
    }

    const shift = await Shift.create({
      tenantId,
      ...parsed.data,
    });

    res.status(201).json({ shift });
  } catch (err) {
    next(err);
  }
}

export async function updateShift(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    const shift = await Shift.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!shift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }

    res.status(200).json({ shift });
  } catch (err) {
    next(err);
  }
}
