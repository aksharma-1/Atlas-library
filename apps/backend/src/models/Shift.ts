import { Schema, model, type Document, type Types } from 'mongoose';

export interface IShift extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  startTime: string; // HH:mm format e.g. "07:00"
  endTime: string;   // HH:mm format e.g. "15:00"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shiftSchema = new Schema<IShift>(
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
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
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

shiftSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Shift = model<IShift>('Shift', shiftSchema);
