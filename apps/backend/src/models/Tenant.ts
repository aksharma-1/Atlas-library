import { Schema, model, type Document, type Types } from 'mongoose';

export interface ITenant extends Document {
  _id: Types.ObjectId;
  /** Human-readable library name shown in UI */
  name: string;
  /** URL-safe unique identifier, e.g. "atlas-library-indore" */
  slug: string;
  /** Primary contact email for the library */
  email: string;
  /** Primary contact phone */
  phone?: string;
  /** City / location description */
  city?: string;
  /** Whether this tenant account is active */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    city: {
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
    // Never return __v to clients
    toJSON: { versionKey: false },
  },
);

export const Tenant = model<ITenant>('Tenant', tenantSchema);
