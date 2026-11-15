import { Schema, model, type Document, type Types } from 'mongoose';

export type SaasPaymentStatus = 'pending' | 'approved' | 'rejected';
export type SaasBillingCycle = 'monthly' | 'yearly';

export interface ISaasPayment extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  saasPlanId?: Types.ObjectId;
  planCode: string;
  planName: string;
  amountPaise: number;
  billingCycle: SaasBillingCycle;
  utr: string;
  status: SaasPaymentStatus;
  submittedAt: Date;
  decidedAt?: Date;
  decidedBy?: Types.ObjectId; // References User (Super Admin)
  rejectionReason?: string;
  validityStartDate?: Date;
  validityEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const saasPaymentSchema = new Schema<ISaasPayment>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    saasPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'SaasPlan',
    },
    planCode: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer paise value',
      },
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'] satisfies SaasBillingCycle[],
      default: 'monthly',
      required: true,
    },
    utr: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'] satisfies SaasPaymentStatus[],
      default: 'pending',
      required: true,
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    decidedAt: {
      type: Date,
    },
    decidedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    validityStartDate: {
      type: Date,
    },
    validityEndDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  },
);

// Compound index for querying a tenant's payment history chronologically
saasPaymentSchema.index({ tenantId: 1, createdAt: -1 });

export const SaasPayment = model<ISaasPayment>('SaasPayment', saasPaymentSchema);
