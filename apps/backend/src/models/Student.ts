import { Schema, model, type Document, type Types } from 'mongoose';

export interface IStudent extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  mobile: string;
  email?: string;
  membershipNumber: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
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
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    membershipNumber: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  },
);

studentSchema.index({ tenantId: 1, membershipNumber: 1 }, { unique: true });
studentSchema.index({ tenantId: 1, mobile: 1 });

export const Student = model<IStudent>('Student', studentSchema);
