import { Schema, model, type Document, type Types } from 'mongoose';

export interface IPlatformConfig extends Document {
  _id: Types.ObjectId;
  key: string; // e.g. 'global'
  yearlyDiscountPercent: number; // e.g. 20 (means 20% off for 12 months)
  upiId?: string;
  upiName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const platformConfigSchema = new Schema<IPlatformConfig>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global',
    },
    yearlyDiscountPercent: {
      type: Number,
      required: true,
      default: 20,
      min: 0,
      max: 100,
    },
    upiId: {
      type: String,
      trim: true,
    },
    upiName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const PlatformConfig = model<IPlatformConfig>('PlatformConfig', platformConfigSchema);
