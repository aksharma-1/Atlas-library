/**
 * Auth API contracts shared between backend and frontend.
 * These types define the shape of request bodies and response payloads
 * for all authentication endpoints.
 */

/** Body sent to POST /api/v1/auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * The authenticated user payload embedded in the JWT and
 * returned by GET /api/v1/auth/me and POST /api/v1/auth/login.
 *
 * NEVER includes passwordHash or any sensitive credential.
 */
export type SubscriptionTier = 'starter' | 'growth' | 'pro' | string;
export type SubscriptionStatus = 'pending_payment' | 'pending_approval' | 'active' | 'past_due' | 'cancelled';
export type OnboardingStep = 'profile' | 'config' | 'subscription' | 'completed';

export interface AuthUser {
  userId: string;
  tenantId?: string;
  name: string;
  email: string;
  role: 'owner' | 'staff' | 'superadmin';
  tenantName?: string;
  phone?: string;
  city?: string;
  address?: string;
  onboardingStep?: OnboardingStep;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionTier?: SubscriptionTier;
  subscriptionExpiresAt?: string;
  maxSeats?: number;
  isActive?: boolean;
  whatsappReminderTemplate?: string;
}

/** Payload for updating user & library profile */
export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  city?: string;
  address?: string;
  libraryName?: string;
  currentPassword?: string;
  newPassword?: string;
  whatsappReminderTemplate?: string;
}

/** Full user profile details */
export interface UserProfileDTO {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'staff' | 'superadmin';
    createdAt: string;
  };
  tenant?: {
    id: string;
    name: string;
    slug: string;
    email: string;
    phone?: string;
    city?: string;
    address?: string;
    whatsappReminderTemplate?: string;
    subscriptionTier?: string;
    subscriptionStatus?: SubscriptionStatus;
    subscriptionExpiresAt?: string;
    maxSeats: number;
    createdAt: string;
  };
}

/** Request payload for requesting password reset OTP / link */
export interface ForgotPasswordRequest {
  email: string;
}

/** Request payload for resetting password */
export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

/** Response body from POST /api/v1/auth/login */
export interface LoginResponse {
  user: AuthUser;
}

/** Response body from GET /api/v1/auth/me */
export interface MeResponse {
  user: AuthUser;
}
