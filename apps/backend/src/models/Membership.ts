import { Schema, model, type Document, type Types } from 'mongoose';
import type { MembershipStatus, PaymentStatus, SeatType } from '@atlas/shared';

export interface IMembership extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  studentId: Types.ObjectId;
  planId: Types.ObjectId;
  shiftId?: Types.ObjectId;
  seatId?: Types.ObjectId;
  seatType: SeatType;
  startDate: Date;
  endDate: Date;
  status: MembershipStatus;
  feePaise: number;
  paidPaise: number;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    shiftId: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
    },
    seatId: {
      type: Schema.Types.ObjectId,
      ref: 'Seat',
    },
    seatType: {
      type: String,
      enum: ['reserved', 'non-reserved'] satisfies SeatType[],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'] satisfies MembershipStatus[],
      default: 'active',
      index: true,
    },
    feePaise: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer paise value',
      },
    },
    paidPaise: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer paise value',
      },
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'pending'] satisfies PaymentStatus[],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  },
);

// Index to quickly query active memberships by seat (for conflict checking)
membershipSchema.index({ tenantId: 1, seatId: 1, status: 1 });

export const Membership = model<IMembership>('Membership', membershipSchema);
