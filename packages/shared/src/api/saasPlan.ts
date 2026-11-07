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

export interface UpdatePlatformConfigRequest {
  yearlyDiscountPercent?: number;
  upiId?: string;
  upiName?: string;
}
