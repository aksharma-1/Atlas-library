/**
 * SaaS Subscription Plan API contracts shared between backend and frontend.
 */
export interface SaasPlanDTO {
  _id: string;
  code: string;
  name: string;
  tagline?: string;
  monthlyPrice: number; // in Rupees
  maxDesks: number;
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface SaasPlatformConfigDTO {
  yearlyDiscountPercent: number; // e.g. 20 for 20% discount
  upiId?: string;
  upiName?: string;
  trialDurationDays?: number; // default: 14 days
  trialMaxSeats?: number; // default: 50 seats
}

export interface SaasPlansResponse {
  plans: SaasPlanDTO[];
  config: SaasPlatformConfigDTO;
}

export interface CreateSaasPlanRequest {
  code: string;
  name: string;
  tagline?: string;
  monthlyPrice: number;
  maxDesks: number;
  features: string[];
  isPopular?: boolean;
  sortOrder?: number;
}

export interface UpdateSaasPlanRequest {
  code?: string;
  name?: string;
  tagline?: string;
  monthlyPrice?: number;
  maxDesks?: number;
  features?: string[];
  isPopular?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface SaasPaymentDTO {
  _id: string;
  tenantId: string;
  saasPlanId?: string;
  planCode: string;
  planName: string;
  amountPaise: number;
  billingCycle: 'monthly' | 'yearly';
  utr: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  rejectionReason?: string;
  validityStartDate?: string;
  validityEndDate?: string;
  createdAt: string;
}

export interface UpdatePlatformConfigRequest {
  yearlyDiscountPercent?: number;
  upiId?: string;
  upiName?: string;
  trialDurationDays?: number;
  trialMaxSeats?: number;
}
