import { Schema, model, type Document, type Types } from 'mongoose';
import type { PaymentMethod } from '@atlas/shared';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  membershipId: Types.ObjectId;
  studentId: Types.ObjectId;
  receiptNumber: string;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  transactionRef?: string;
  idempotencyKey?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    membershipId: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    receiptNumber: {
      type: String,
      required: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer paise value',
      },
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'bank_transfer'] satisfies PaymentMethod[],
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    transactionRef: {
      type: String,
      trim: true,
    },
    idempotencyKey: {
      type: String,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  },
);

paymentSchema.index({ tenantId: 1, receiptNumber: 1 }, { unique: true });
// Use partialFilterExpression so documents without an idempotencyKey or with null/undefined are NOT indexed.
// This completely prevents E11000 duplicate key errors for multiple payments that do not specify an idempotency key.
paymentSchema.index(
  { tenantId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } },
  },
);

export const Payment = model<IPayment>('Payment', paymentSchema);
