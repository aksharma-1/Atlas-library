import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { StudentDTO, StudentProfileDTO, MembershipDTO, PaymentDTO } from '@atlas/shared';

export function useStudents(search?: string) {
  return useQuery({
    queryKey: ['students', search],
    queryFn: async () => {
      const { data } = await apiClient.get<{ students: StudentDTO[] }>('/students', {
        params: search ? { search } : undefined,
      });
      return data.students;
    },
  });
}

export function useStudentProfile(id?: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: async () => {
      const { data } = await apiClient.get<StudentProfileDTO>(`/students/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      mobile: string;
      email?: string;
      address?: string;
      membershipNumber?: string;
    }) => {
      const { data } = await apiClient.post<{ student: StudentDTO }>('/students', payload);
      return data.student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}

export function useCreateMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      studentId: string;
      planId: string;
      shiftId?: string;
      seatId?: string;
      startDate: string;
      endDate: string;
    }) => {
      const { data } = await apiClient.post<{ membership: MembershipDTO }>('/memberships', payload);
      return data.membership;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['students', vars.studentId] });
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      membershipId: string;
      amountPaise: number;
      paymentMethod: 'cash' | 'upi' | 'card' | 'bank_transfer';
      transactionRef?: string;
      idempotencyKey?: string;
      notes?: string;
    }) => {
      const { data } = await apiClient.post<{ payment: PaymentDTO; updatedMembership: MembershipDTO }>(
        '/payments',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}
