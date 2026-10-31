import { Schema, model, type Document, type Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'owner' | 'staff';

export interface IUser extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  email: string;
  /** Bcrypt-hashed password — never returned to clients */
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** Instance method: compares plain password against stored hash */
  comparePassword(plain: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
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
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
      // Never include passwordHash in any query result by default
      select: false,
    },
    role: {
      type: String,
      enum: ['owner', 'staff'] satisfies UserRole[],
      required: true,
      default: 'staff',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret: Record<string, unknown>) {
        // Hard-remove passwordHash from any toJSON output
        delete ret['passwordHash'];
        return ret;
      },
    },
  },
);

// ── Compound unique index: one email per tenant ──────────────────────────────
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

// ── Instance method ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = function (
  plain: string,
): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash as string);
};

export const User = model<IUser>('User', userSchema);
