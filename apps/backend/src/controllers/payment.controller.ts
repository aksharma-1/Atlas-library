import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Payment } from '../models/Payment';
import { Membership } from '../models/Membership';
import { getNextReceiptNumber } from '../models/Counter';

const recordPaymentSchema = z.object({
  membershipId: z.string().min(1, 'Membership ID is required'),
  amountPaise: z.number().int().min(1, 'Amount must be positive integer paise'),
  paymentMethod: z.enum(['cash', 'upi', 'card', 'bank_transfer']),
  transactionRef: z.string().optional(),
  idempotencyKey: z.string().optional(),
  notes: z.string().optional(),
});

export async function recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = recordPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const tenantId = req.user!.tenantId!;
    const { membershipId, amountPaise, paymentMethod, transactionRef, idempotencyKey, notes } = parsed.data;

    // ── Idempotency Check ───────────────────────────────────────────────────
    if (idempotencyKey) {
      const existing = await Payment.findOne({ tenantId, idempotencyKey });
      if (existing) {
        res.status(200).json({ payment: existing, note: 'Idempotent replay' });
        return;
      }
    }

    const membership = await Membership.findOne({ _id: membershipId, tenantId });
    if (!membership) {
      res.status(404).json({ error: 'Membership not found' });
      return;
    }

    // ── Due Overpayment Validation ───────────────────────────────────────────
    const remainingDuePaise = Math.max(0, membership.feePaise - membership.paidPaise);
    if (remainingDuePaise <= 0) {
      res.status(400).json({
        error: `This membership fee is already fully paid (₹${(membership.feePaise / 100).toFixed(0)} / ₹${(membership.feePaise / 100).toFixed(0)}). No further payment is due.`,
      });
      return;
    }

    if (amountPaise > remainingDuePaise) {
      const dueRupees = (remainingDuePaise / 100).toFixed(0);
      const attemptedRupees = (amountPaise / 100).toFixed(0);
      res.status(400).json({
        error: `Payment amount ₹${attemptedRupees} exceeds the remaining due of ₹${dueRupees}. Maximum payable amount is ₹${dueRupees}.`,
      });
      return;
    }

    // Atomically generate collision-proof receipt number (e.g. REC-2026-0001)
    const receiptNumber = await getNextReceiptNumber(tenantId);

    const paymentData: Record<string, unknown> = {
      tenantId,
      membershipId: membership._id,
      studentId: membership.studentId,
      receiptNumber,
      amountPaise,
      paymentMethod,
    };

    if (transactionRef) {
      paymentData['transactionRef'] = transactionRef;
    }
    if (idempotencyKey && idempotencyKey.trim()) {
      paymentData['idempotencyKey'] = idempotencyKey.trim();
    }
    if (notes) {
      paymentData['notes'] = notes;
    }

    const payment = await Payment.create(paymentData);

    // Update membership payment tallies
    const newPaidPaise = membership.paidPaise + amountPaise;
    let paymentStatus: 'paid' | 'partial' | 'pending' = 'partial';

    if (newPaidPaise >= membership.feePaise) {
      paymentStatus = 'paid';
    } else if (newPaidPaise === 0) {
      paymentStatus = 'pending';
    }

    membership.paidPaise = newPaidPaise;
    membership.paymentStatus = paymentStatus;
    await membership.save();

    res.status(201).json({ payment, updatedMembership: membership });
  } catch (err) {
    next(err);
  }
}

export async function getReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId!;

    const payment = await Payment.findOne({ _id: id, tenantId })
      .populate('studentId', 'name mobile membershipNumber address')
      .populate('membershipId');

    if (!payment) {
      res.status(404).json({ error: 'Payment receipt not found' });
      return;
    }

    res.status(200).json({ payment });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/payments/:id
 * Reverses an accidental or duplicate payment and adjusts the student's membership balance.
 */
export async function deletePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId!;

    const payment = await Payment.findOne({ _id: id, tenantId });
    if (!payment) {
      res.status(404).json({ error: 'Payment entry not found' });
      return;
    }

    const membership = await Membership.findOne({ _id: payment.membershipId, tenantId });
    if (membership) {
      // Deduct the deleted payment amount
      const updatedPaidPaise = Math.max(0, membership.paidPaise - payment.amountPaise);
      membership.paidPaise = updatedPaidPaise;

      if (updatedPaidPaise >= membership.feePaise) {
        membership.paymentStatus = 'paid';
      } else if (updatedPaidPaise === 0) {
        membership.paymentStatus = 'pending';
      } else {
        membership.paymentStatus = 'partial';
      }

      await membership.save();
    }

    await Payment.findByIdAndDelete(payment._id);

    res.status(200).json({
      message: `Receipt ${payment.receiptNumber} (₹${(payment.amountPaise / 100).toFixed(0)}) removed successfully`,
    });
  } catch (err) {
    next(err);
  }
}
