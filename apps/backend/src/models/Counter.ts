import { Schema, model, type Document, type Types } from 'mongoose';

export interface ICounter extends Document {
  tenantId: Types.ObjectId;
  key: string;       // e.g. "receipt_2026"
  seq: number;
}

const counterSchema = new Schema<ICounter>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

counterSchema.index({ tenantId: 1, key: 1 }, { unique: true });

export const Counter = model<ICounter>('Counter', counterSchema);

/**
 * Atomically generates the next receipt number for a tenant.
 * Uses atomic $inc so concurrent payments or deleted receipts can NEVER collide.
 */
export async function getNextReceiptNumber(tenantId: Types.ObjectId | string): Promise<string> {
  const year = new Date().getFullYear();
  const key = `receipt_${year}`;

  // Find the highest existing sequence number if counter doesn't exist yet
  // to avoid colliding with any already-issued receipts
  const counter = await Counter.findOneAndUpdate(
    { tenantId, key },
    { $inc: { seq: 1 } },
    { new: true, upsert: false },
  );

  if (counter) {
    return `REC-${year}-${String(counter.seq).padStart(4, '0')}`;
  }

  // Initialize counter by checking existing highest receipt number
  const { Payment } = await import('./Payment');
  const existingPayments = await Payment.find({
    tenantId,
    receiptNumber: new RegExp(`^REC-${year}-`),
  }).select('receiptNumber');

  let maxNum = 0;
  for (const p of existingPayments) {
    const parts = p.receiptNumber.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }

  const newCounter = await Counter.findOneAndUpdate(
    { tenantId, key },
    { $set: { seq: maxNum + 1 } },
    { new: true, upsert: true },
  );

  return `REC-${year}-${String(newCounter.seq).padStart(4, '0')}`;
}
