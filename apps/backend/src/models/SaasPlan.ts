import { Schema, model, type Document, type Types } from 'mongoose';

export interface ISaasPlan extends Document {
  _id: Types.ObjectId;
  code: string; // e.g. 'starter', 'growth', 'pro'
  name: string;
  tagline?: string;
  monthlyPrice: number; // In INR Rupees
  maxDesks: number;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const saasPlanSchema = new Schema<ISaasPlan>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDesks: {
      type: Number,
      required: true,
      min: 1,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const SaasPlan = model<ISaasPlan>('SaasPlan', saasPlanSchema);
