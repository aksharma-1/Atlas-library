// Public surface of @atlas/shared
// Add new module exports here as the project grows.

export type { HealthResponse } from './api/health';
export type { LoginRequest, LoginResponse, MeResponse, AuthUser } from './api/auth';
export type {
  ShiftDTO,
  SeatType,
  PlanDTO,
  SeatStatus,
  SeatDTO,
  DashboardStatsDTO,
} from './api/library';
