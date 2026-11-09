/**
 * Shared interfaces for Shifts, Plans, Seats, and Dashboard stats.
 */

export interface ShiftDTO {
  _id: string;
  tenantId: string;
  name: string;
  startTime: string; // HH:mm format e.g. "07:00"
  endTime: string;   // HH:mm format e.g. "15:00"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SeatType = 'reserved' | 'non-reserved';

export interface PlanDTO {
  _id: string;
  tenantId: string;
  name: string;
  seatType: SeatType;
  shiftIds: string[]; // references Shift
  feePaise: number;   // stored in integer paise
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SeatStatus = 'available' | 'occupied' | 'maintenance' | 'blocked';

export interface SeatStudentInfo {
  membershipId: string;
  studentId: string;
  name: string;
  mobile: string;
  photoUrl?: string;
  membershipNumber: string;
  planName?: string;
  shiftName?: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  hasDues: boolean;
  duePaise: number;
}

export interface SeatDTO {
  _id: string;
  tenantId: string;
  seatNumber: string;
  section?: string;
  status: SeatStatus;
  createdAt: string;
  updatedAt: string;
  /** Active occupant for the selected shift or active overall */
  occupant?: SeatStudentInfo;
  /** Multi-shift occupants breakdown for reception drawer */
  shiftOccupants?: {
    shiftId: string;
    shiftName: string;
    student: SeatStudentInfo;
  }[];
}

export interface DashboardStatsDTO {
  totalSeats: number;
  availableSeats: number;
  occupiedSeats: number;
  maintenanceSeats: number;
  totalPlans: number;
  totalShifts: number;
  totalStudents: number;
  duesOutstandingPaise: number;
  dueMembersCount: number;
  expiringIn3DaysCount: number;
  expiringIn7DaysCount: number;
  expiredCount: number;
}
