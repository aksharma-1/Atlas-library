/**
 * Shared interfaces for Shifts, Plans, Seats, and Dashboard stats.
 */
export interface ShiftDTO {
    _id: string;
    tenantId: string;
    name: string;
    startTime: string;
    endTime: string;
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
    shiftIds: string[];
    feePaise: number;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export type SeatStatus = 'available' | 'occupied' | 'maintenance' | 'blocked';
export interface SeatDTO {
    _id: string;
    tenantId: string;
    seatNumber: string;
    section?: string;
    status: SeatStatus;
    createdAt: string;
    updatedAt: string;
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
}
//# sourceMappingURL=library.d.ts.map