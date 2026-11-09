import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { StudentDTO, StudentProfileDTO, MembershipDTO, PaymentDTO } from '@atlas/shared';
import toast from 'react-hot-toast';

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
      photoUrl?: string;
    }) => {
      const { data } = await apiClient.post<{ student: StudentDTO }>('/students', payload);
      return data.student;
    },
    onSuccess: (student) => {
      toast.success(`Student "${student.name}" registered successfully!`);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to register student');
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
      toast.success('Desk assigned & membership activated!');
      queryClient.invalidateQueries({ queryKey: ['students', vars.studentId] });
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to assign membership');
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
    onSuccess: (data) => {
      toast.success(`Payment of ₹${(data.payment.amountPaise / 100).toFixed(0)} recorded successfully!`);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['filteredMemberships'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to record payment');
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: {
      id: string;
      name?: string;
      mobile?: string;
      email?: string;
      address?: string;
      membershipNumber?: string;
      photoUrl?: string;
    }) => {
      const { data } = await apiClient.put<{ student: StudentDTO }>(`/students/${id}`, payload);
      return data.student;
    },
    onSuccess: (_, vars) => {
      toast.success(`Student profile updated`);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', vars.id] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to update student profile');
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ message: string }>(`/students/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Student deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['filteredMemberships'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to delete student');
    },
  });
}

export function useMarkMembershipLeft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ membershipId }: { membershipId: string; studentId: string }) => {
      const { data } = await apiClient.patch<{ message: string; membership: MembershipDTO }>(
        `/memberships/${membershipId}/left`,
      );
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success('Seat vacated and marked as Left');
      queryClient.invalidateQueries({ queryKey: ['students', vars.studentId] });
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['filteredMemberships'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to vacate seat');
    },
  });
}

export function useAddGiftDays() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      membershipId,
      days,
      reason,
    }: {
      membershipId: string;
      studentId: string;
      days: number;
      reason?: string;
    }) => {
      const { data } = await apiClient.post<{ message: string; membership: MembershipDTO }>(
        `/memberships/${membershipId}/gift-days`,
        { days, reason },
      );
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success(`Gift days added successfully!`);
      queryClient.invalidateQueries({ queryKey: ['students', vars.studentId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['filteredMemberships'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to add gift days');
    },
  });
}

export function useFilteredMemberships(filter?: string) {
  return useQuery({
    queryKey: ['filteredMemberships', filter],
    queryFn: async () => {
      const { data } = await apiClient.get<{ memberships: (MembershipDTO & { studentId?: StudentDTO })[] }>(
        '/memberships',
        {
          params: filter && filter !== 'all' ? { filter } : undefined,
        },
      );
      return data.memberships;
    },
  });
}

