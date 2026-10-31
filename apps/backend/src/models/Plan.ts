import { Schema, model, type Document, type Types } from 'mongoose';
import type { SeatType } from '@atlas/shared';

export interface IPlan extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  seatType: SeatType;
  shiftIds: Types.ObjectId[];
  feePaise: number; // Stored strictly as integer paise
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    seatType: {
      type: String,
      enum: ['reserved', 'non-reserved'] satisfies SeatType[],
      required: true,
    },
    shiftIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Shift',
      },
    ],
    feePaise: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value in paise',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  },
);

planSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Plan = model<IPlan>('Plan', planSchema);
