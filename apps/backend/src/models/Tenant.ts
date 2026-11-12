import { Schema, model, type Document, type Types } from 'mongoose';
import type { SubscriptionStatus, OnboardingStep } from '@atlas/shared';

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
  /** Full address of the library */
  address?: string;
  /** Whether this tenant account is active */
  isActive: boolean;
  /** Onboarding funnel step */
  onboardingStep: OnboardingStep;
  /** Subscription plan tier */
  subscriptionTier?: string;
  /** Current subscription payment status */
  subscriptionStatus: SubscriptionStatus;
  /** Subscription validity expiration */
  subscriptionExpiresAt?: Date;
  /** Last submitted UPI transaction ref (UTR) */
  lastUtrRef?: string;
  /** When UPI UTR was submitted */
  lastPaymentSubmittedAt?: Date;
  /** Max seat inventory capacity allowed */
  maxSeats: number;
  /** Custom WhatsApp reminder template with variables */
  whatsappReminderTemplate?: string;
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
    address: {
      type: String,
      trim: true,
    },
    whatsappReminderTemplate: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    onboardingStep: {
      type: String,
      enum: ['profile', 'config', 'subscription', 'completed'] satisfies OnboardingStep[],
      default: 'completed',
    },
    subscriptionTier: {
      type: String,
    },
    subscriptionStatus: {
      type: String,
      enum: ['pending_payment', 'pending_approval', 'active', 'past_due', 'cancelled'] satisfies SubscriptionStatus[],
      default: 'active',
    },
    subscriptionExpiresAt: {
      type: Date,
    },
    lastUtrRef: {
      type: String,
      trim: true,
    },
    lastPaymentSubmittedAt: {
      type: Date,
    },
    maxSeats: {
      type: Number,
      default: 100,
    },
  },
  {
    timestamps: true,
    // Never return __v to clients
    toJSON: { versionKey: false },
  },
);

export const Tenant = model<ITenant>('Tenant', tenantSchema);
