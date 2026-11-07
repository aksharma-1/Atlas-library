import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { ShiftDTO, PlanDTO, SeatDTO, DashboardStatsDTO } from '@atlas/shared';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
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
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
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
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}

// ── Seats ────────────────────────────────────────────────────────────────────
export function useSeats() {
  return useQuery({
    queryKey: ['seats'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ seats: SeatDTO[] }>('/seats');
      return data.seats;
    },
  });
}

export function useBulkCreateSeats() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { startNumber: number; endNumber: number; prefix?: string; section?: string }) => {
      const { data } = await apiClient.post<{ createdCount: number; seats: SeatDTO[] }>('/seats/bulk', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}
