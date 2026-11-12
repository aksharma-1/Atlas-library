import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { ShiftDTO, PlanDTO, SeatDTO, DashboardStatsDTO, RevenueStatsDTO } from '@atlas/shared';
import toast from 'react-hot-toast';

// ── Dashboard Stats ──────────────────────────────────────────────────────────
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ stats: DashboardStatsDTO }>('/dashboard/stats');
      return data.stats;
    },
    staleTime: 30 * 1000,
  });
}

// ── Revenue Stats ────────────────────────────────────────────────────────────
export function useRevenueStats() {
  return useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ stats: RevenueStatsDTO }>('/dashboard/revenue');
      return data.stats;
    },
    staleTime: 30 * 1000,
  });
}

// ── Shifts ───────────────────────────────────────────────────────────────────
export function useShifts() {
  return useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ shifts: ShiftDTO[] }>('/shifts');
      return data.shifts;
    },
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shift: { name: string; startTime: string; endTime: string }) => {
      const { data } = await apiClient.post<{ shift: ShiftDTO }>('/shifts', shift);
      return data.shift;
    },
    onSuccess: (shift) => {
      toast.success(`Shift "${shift.name}" created successfully`);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to create shift');
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...shift }: { id: string; name?: string; startTime?: string; endTime?: string; isActive?: boolean }) => {
      const { data } = await apiClient.put<{ shift: ShiftDTO }>(`/shifts/${id}`, shift);
      return data.shift;
    },
    onSuccess: (shift) => {
      toast.success(`Shift "${shift.name}" updated`);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to update shift');
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ message: string }>(`/shifts/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Shift deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to delete shift');
    },
  });
}

// ── Plans ────────────────────────────────────────────────────────────────────
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ plans: PlanDTO[] }>('/plans');
      return data.plans;
    },
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: {
      name: string;
      seatType: 'reserved' | 'non-reserved';
      shiftIds: string[];
      feePaise: number;
      description?: string;
    }) => {
      const { data } = await apiClient.post<{ plan: PlanDTO }>('/plans', plan);
      return data.plan;
    },
    onSuccess: (plan) => {
      toast.success(`Plan "${plan.name}" created successfully`);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to create plan');
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...plan }: {
      id: string;
      name?: string;
      seatType?: 'reserved' | 'non-reserved';
      shiftIds?: string[];
      feePaise?: number;
      description?: string;
      isActive?: boolean;
    }) => {
      const { data } = await apiClient.put<{ plan: PlanDTO }>(`/plans/${id}`, plan);
      return data.plan;
    },
    onSuccess: (plan) => {
      toast.success(`Plan "${plan.name}" updated`);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to update plan');
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ message: string }>(`/plans/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Plan deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to delete plan');
    },
  });
}

// ── Seats ────────────────────────────────────────────────────────────────────
export function useSeats(params?: { shiftId?: string; section?: string }) {
  return useQuery({
    queryKey: ['seats', params?.shiftId, params?.section],
    queryFn: async () => {
      const { data } = await apiClient.get<{ seats: SeatDTO[] }>('/seats', {
        params: {
          shiftId: params?.shiftId && params.shiftId !== 'all' ? params.shiftId : undefined,
          section: params?.section && params.section !== 'all' ? params.section : undefined,
        },
      });
      return data.seats;
    },
  });
}

export function useChangeSeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { membershipId: string; targetSeatId: string }) => {
      const { data } = await apiClient.post<{ message: string }>('/seats/change', payload);
      return data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Seat changed successfully');
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['filteredMemberships'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to change desk');
    },
  });
}

export function useCreateSingleSeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { seatNumber: string; section?: string }) => {
      const { data } = await apiClient.post<{ seat: SeatDTO }>('/seats', payload);
      return data.seat;
    },
    onSuccess: (seat) => {
      toast.success(`Desk "${seat.seatNumber}" added successfully`);
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to add desk');
    },
  });
}

export function useBulkCreateSeats() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { startNumber: number; endNumber: number; prefix?: string; section?: string }) => {
      const { data } = await apiClient.post<{ createdCount: number; seats: SeatDTO[]; note?: string }>('/seats/bulk', params);
      return data;
    },
    onSuccess: (res) => {
      toast.success(`Generated ${res.createdCount} desks successfully!`);
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to bulk generate desks');
    },
  });
}

export function useUpdateSeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; seatNumber?: string; section?: string; status?: 'available' | 'occupied' | 'maintenance' | 'blocked' }) => {
      const { data } = await apiClient.put<{ seat: SeatDTO }>(`/seats/${id}`, payload);
      return data.seat;
    },
    onSuccess: (seat) => {
      toast.success(`Desk "${seat.seatNumber}" updated`);
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to update desk');
    },
  });
}

export function useDeleteSeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ message: string }>(`/seats/${id}`);
      return data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Desk deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to delete desk');
    },
  });
}

export function useDeleteSeatsBySection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (section: string) => {
      const { data } = await apiClient.delete<{ message: string; deletedCount: number }>('/seats/section/bulk', {
        params: { section },
      });
      return data;
    },
    onSuccess: (res) => {
      toast.success(res.message || `Deleted desks in section`);
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to delete section');
    },
  });
}

export function useUpdateSeatStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'available' | 'occupied' | 'maintenance' | 'blocked' }) => {
      const { data } = await apiClient.patch<{ seat: SeatDTO }>(`/seats/${id}/status`, { status });
      return data.seat;
    },
    onSuccess: (seat) => {
      toast.success(`Desk "${seat.seatNumber}" is now ${seat.status}`);
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Failed to update status');
    },
  });
}
