import type { Request, Response, NextFunction } from 'express';
import { SaasPlan } from '../models/SaasPlan';
import { PlatformConfig } from '../models/PlatformConfig';

// Default initial plans if database has none
export const INITIAL_SAAS_PLANS = [
  {
    code: 'starter',
    name: 'Starter Space',
    tagline: 'Ideal for small libraries and independent study rooms',
    monthlyPrice: 499,
    maxDesks: 50,
    features: [
      'Up to 50 Desks Capacity',
      'Unlimited Students & Members',
      'Visual Seating Map',
      'Printable ID Cards & Receipts',
      'WhatsApp Renewal Reminders',
    ],
    isPopular: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    code: 'growth',
    name: 'Growth Library',
    tagline: 'Best for expanding reading rooms and multi-shift setups',
    monthlyPrice: 999,
    maxDesks: 150,
    features: [
      'Up to 150 Desks Capacity',
      'Unlimited Students & Members',
      'Visual Seating Map',
      'Multi-Shift Scheduling',
      'Dues & Fees Tracking',
      'Custom WhatsApp Templates',
      'Priority Support',
    ],
    isPopular: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    code: 'pro',
    name: 'Enterprise / Hub',
    tagline: 'For large study centers and multi-hall learning hubs',
    monthlyPrice: 1499,
    maxDesks: 500,
    features: [
      'Up to 500 Desks Inventory',
      'Multiple Study Hall Sections',
      'All Standard & Growth Features',
      'Dedicated Support & Assistance',
      'Free Future Platform Updates',
    ],
    isPopular: false,
    isActive: true,
    sortOrder: 3,
  },
];

/**
 * GET /api/v1/saas-plans (Public / Authenticated)
 * Returns all active SaaS plans and global platform pricing configuration (e.g. yearly discount).
 */
export async function getPublicSaasPlans(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let plans = await SaasPlan.find({ isActive: true }).sort({ sortOrder: 1, monthlyPrice: 1 }).lean();

    // Auto-seed defaults if table is empty
    if (plans.length === 0) {
      await SaasPlan.insertMany(INITIAL_SAAS_PLANS);
      plans = await SaasPlan.find({ isActive: true }).sort({ sortOrder: 1, monthlyPrice: 1 }).lean();
    }

    let configDoc = await PlatformConfig.findOne({ key: 'global' });
    if (!configDoc) {
      configDoc = await PlatformConfig.create({
        key: 'global',
        yearlyDiscountPercent: 20,
        upiId: process.env.VITE_PLATFORM_UPI_ID || 'studyspace@upi',
        upiName: process.env.VITE_PLATFORM_UPI_NAME || 'StudySpace OS',
      });
    }

    res.status(200).json({
      plans,
      config: {
        yearlyDiscountPercent: configDoc.yearlyDiscountPercent,
        upiId: configDoc.upiId,
        upiName: configDoc.upiName,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/superadmin/saas-plans (Super Admin only)
 * Returns all plans (active & inactive) plus config.
 */
export async function getAllSaasPlansAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let plans = await SaasPlan.find().sort({ sortOrder: 1, monthlyPrice: 1 }).lean();
    if (plans.length === 0) {
      await SaasPlan.insertMany(INITIAL_SAAS_PLANS);
      plans = await SaasPlan.find().sort({ sortOrder: 1, monthlyPrice: 1 }).lean();
    }

    let configDoc = await PlatformConfig.findOne({ key: 'global' });
    if (!configDoc) {
      configDoc = await PlatformConfig.create({
        key: 'global',
        yearlyDiscountPercent: 20,
      });
    }

    res.status(200).json({
      plans,
      config: {
        yearlyDiscountPercent: configDoc.yearlyDiscountPercent,
        upiId: configDoc.upiId,
        upiName: configDoc.upiName,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/superadmin/saas-plans (Super Admin only)
 * Create a new SaaS plan.
 */
export async function createSaasPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, name, tagline, monthlyPrice, maxDesks, features, isPopular, sortOrder } = req.body;

    if (!code || !name || monthlyPrice === undefined || !maxDesks) {
      res.status(400).json({ error: 'Code, name, monthlyPrice, and maxDesks are required.' });
      return;
    }

    const cleanCode = String(code).trim().toLowerCase();
    const existing = await SaasPlan.findOne({ code: cleanCode });
    if (existing) {
      res.status(409).json({ error: `A plan with code "${cleanCode}" already exists.` });
      return;
    }

    const newPlan = await SaasPlan.create({
      code: cleanCode,
      name: String(name).trim(),
      tagline: tagline ? String(tagline).trim() : undefined,
      monthlyPrice: Number(monthlyPrice),
      maxDesks: Number(maxDesks),
      features: Array.isArray(features) ? features : [],
      isPopular: Boolean(isPopular),
      sortOrder: Number(sortOrder) || 0,
      isActive: true,
    });

    res.status(201).json({ plan: newPlan, message: 'Plan created successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/superadmin/saas-plans/:id (Super Admin only)
 * Update existing plan details, pricing, maxDesks, status, etc.
 */
export async function updateSaasPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;

    const plan = await SaasPlan.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }

    res.status(200).json({ plan, message: 'Plan updated successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/superadmin/saas-plans/:id (Super Admin only)
 * Permanently delete or disable a plan.
 */
export async function deleteSaasPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const plan = await SaasPlan.findByIdAndDelete(id);
    if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }

    res.status(200).json({ message: `Plan "${plan.name}" deleted successfully` });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/superadmin/platform-config (Super Admin only)
 * Updates yearly discount percentage and optional global UPI settings.
 */
export async function updatePlatformConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { yearlyDiscountPercent, upiId, upiName } = req.body;

    const updateFields: Record<string, unknown> = {};
    if (yearlyDiscountPercent !== undefined) {
      const discount = Number(yearlyDiscountPercent);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        res.status(400).json({ error: 'Discount percent must be a number between 0 and 100' });
        return;
      }
      updateFields.yearlyDiscountPercent = discount;
    }
    if (upiId !== undefined) updateFields.upiId = String(upiId).trim();
    if (upiName !== undefined) updateFields.upiName = String(upiName).trim();

    const config = await PlatformConfig.findOneAndUpdate(
      { key: 'global' },
      { $set: updateFields },
      { upsert: true, new: true },
    );

    res.status(200).json({ config, message: 'Platform config updated successfully' });
  } catch (err) {
    next(err);
  }
}
