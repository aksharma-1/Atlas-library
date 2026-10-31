/**
 * Shared interfaces for Students, Memberships, and Payments.
 */

export interface StudentDTO {
  _id: string;
  tenantId: string;
  name: string;
  mobile: string;
  email?: string;
  membershipNumber: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export type MembershipStatus = 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'paid' | 'partial' | 'pending';

export interface MembershipDTO {
  _id: string;
  tenantId: string;
  studentId: string;
  studentName?: string;
  planId: string;
  planName?: string;
  shiftId?: string;
  shiftName?: string;
  seatId?: string;
  seatNumber?: string;
  seatType: 'reserved' | 'non-reserved';
  startDate: string;
  endDate: string;
  status: MembershipStatus;
  feePaise: number;
  paidPaise: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer';

export interface PaymentDTO {
  _id: string;
  tenantId: string;
  membershipId: string;
  studentId: string;
  receiptNumber: string;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  idempotencyKey?: string;
  notes?: string;
  createdAt: string;
}

export interface StudentProfileDTO {
  student: StudentDTO;
  activeMembership?: MembershipDTO;
  membershipHistory: MembershipDTO[];
  payments: PaymentDTO[];
}
