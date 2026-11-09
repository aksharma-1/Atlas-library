// Public surface of @atlas/shared
// Add new module exports here as the project grows.

export type { HealthResponse } from './api/health';
export type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  AuthUser,
  SubscriptionTier,
  SubscriptionStatus,
  OnboardingStep,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from './api/auth';
export type {
  ShiftDTO,
  SeatType,
  PlanDTO,
  SeatStatus,
  SeatDTO,
  SeatStudentInfo,
  DashboardStatsDTO,
} from './api/library';
export type {
  SaasPlanDTO,
  SaasPlatformConfigDTO,
  SaasPlansResponse,
  CreateSaasPlanRequest,
  UpdateSaasPlanRequest,
  UpdatePlatformConfigRequest,
} from './api/saasPlan';
export type {
  StudentDTO,
  MembershipStatus,
  PaymentStatus,
  MembershipDTO,
  PaymentMethod,
  PaymentDTO,
  StudentProfileDTO,
} from './api/membership';
