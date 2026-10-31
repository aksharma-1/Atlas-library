import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Plan } from '../models/Plan';

const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').trim(),
  seatType: z.enum(['reserved', 'non-reserved']),
  shiftIds: z.array(z.string()).optional().default([]),
  feePaise: z.number().int().min(0, 'Fee must be a positive integer in paise'),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export async function listPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const plans = await Plan.find({ tenantId: req.user!.tenantId })
      .populate('shiftIds', 'name startTime endTime')
      .sort({ createdAt: 1 });
    res.status(200).json({ plans });
  } catch (err) {
    next(err);
  }
}

export async function createPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const tenantId = req.user!.tenantId;
    const existing = await Plan.findOne({ tenantId, name: parsed.data.name });
    if (existing) {
      res.status(409).json({ error: `Plan with name "${parsed.data.name}" already exists` });
      return;
    }

    const plan = await Plan.create({
      tenantId,
      ...parsed.data,
    });

    res.status(201).json({ plan });
  } catch (err) {
    next(err);
  }
}

export async function updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    const plan = await Plan.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }

    res.status(200).json({ plan });
  } catch (err) {
    next(err);
  }
}
