import { Schema, model, type Document, type Types } from 'mongoose';
import type { SeatStatus } from '@atlas/shared';

export interface ISeat extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  seatNumber: string;
  section?: string;
  status: SeatStatus;
  createdAt: Date;
  updatedAt: Date;
}

const seatSchema = new Schema<ISeat>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    seatNumber: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
      default: 'Main Hall',
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'blocked'] satisfies SeatStatus[],
      default: 'available',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  },
);

seatSchema.index({ tenantId: 1, seatNumber: 1 }, { unique: true });

export const Seat = model<ISeat>('Seat', seatSchema);
