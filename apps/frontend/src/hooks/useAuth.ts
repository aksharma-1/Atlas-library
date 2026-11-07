import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import type {
  AuthUser,
  LoginRequest,
  SaasPlansResponse,
  CreateSaasPlanRequest,
  UpdateSaasPlanRequest,
  UpdatePlatformConfigRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@atlas/shared';

const ME_KEY = ['auth', 'me'] as const;

/** Fetch the currently authenticated user from GET /auth/me */
async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<{ user: AuthUser }>('/auth/me');
  return data.user;
}

/**
 * useAuth — central auth hook.
 *
 * Wraps GET /auth/me with TanStack Query.
 * The query only runs once; the cached result is used everywhere else.
 */
export function useAuth() {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ME_KEY,
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 min — re-fetch only when stale
  });

  return { user, isLoading, isAuthenticated: !!user && !isError };
}

/** useLogin — wraps POST /auth/login, invalidates the me query on success */
export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const { data } = await apiClient.post<{ user: AuthUser }>(
        '/auth/login',
        credentials,
      );
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(ME_KEY, user);
      if (user.role === 'superadmin') {
        navigate('/admin');
      } else if (user.subscriptionStatus === 'pending_payment') {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    },
  });
}

/** useRegister — wraps POST /auth/register */
export function useRegister() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      email: string;
      password: string;
      libraryName: string;
      phone: string;
      city?: string;
    }) => {
      const { data } = await apiClient.post<{ user: AuthUser }>('/auth/register', payload);
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(ME_KEY, user);
      navigate('/onboarding');
    },
  });
}

/** useConfigureLibrary — Step 2 onboarding */
export function useConfigureLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { capacity: number; defaultShifts?: boolean }) => {
      const { data } = await apiClient.post<{ user: AuthUser }>('/auth/configure-library', payload);
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(ME_KEY, user);
    },
  });
}

/** useSubmitPaymentUtr — Submits UPI UTR ref for super-admin verification */
export function useSubmitPaymentUtr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { tier: string; utr: string }) => {
      const { data } = await apiClient.post<{ user: AuthUser; message: string }>('/auth/submit-payment', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(ME_KEY, data.user);
    },
  });
}

/** useSuperAdminTenants — Fetch all registered libraries for super-admin */
export function useSuperAdminTenants() {
  return useQuery({
    queryKey: ['superadmin', 'tenants'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ tenants: any[] }>('/superadmin/tenants');
      return data.tenants;
    },
  });
}

/** useApproveTenantSubscription — Super-admin approves UPI payment */
export function useApproveTenantSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, days, tier }: { tenantId: string; days?: number; tier?: string }) => {
      const { data } = await apiClient.post<{ message: string }>(`/superadmin/tenants/${tenantId}/approve`, {
        days,
        tier,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'tenants'] });
    },
  });
}

/** useToggleTenantStatus — Pause or unpause a library account */
export function useToggleTenantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, isActive }: { tenantId: string; isActive: boolean }) => {
      const { data } = await apiClient.post<{ message: string }>(`/superadmin/tenants/${tenantId}/toggle-status`, {
        isActive,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'tenants'] });
    },
  });
}

/** useForgotPassword — request 6-digit reset code */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordRequest) => {
      const { data } = await apiClient.post<{ message: string; debugOtp?: string }>(
        '/auth/forgot-password',
        payload,
      );
      return data;
    },
  });
}

/** useResetPassword — verify 6-digit code and save new password */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: ResetPasswordRequest) => {
      const { data } = await apiClient.post<{ message: string }>(
        '/auth/reset-password',
        payload,
      );
      return data;
    },
  });
}

/** useLogout — wraps POST /auth/logout, clears query cache, redirects to /login */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
      navigate('/login');
    },
  });
}

/** usePublicSaasPlans — fetch active plans + config (public or onboarding) */
export function usePublicSaasPlans() {
  return useQuery<SaasPlansResponse>({
    queryKey: ['saas-plans', 'public'],
    queryFn: async () => {
      const { data } = await apiClient.get<SaasPlansResponse>('/saas-plans');
      return data;
    },
  });
}

/** useSuperAdminSaasPlans — fetch all plans + config (Super Admin) */
export function useSuperAdminSaasPlans() {
  return useQuery<SaasPlansResponse>({
    queryKey: ['saas-plans', 'admin'],
    queryFn: async () => {
      const { data } = await apiClient.get<SaasPlansResponse>('/superadmin/saas-plans');
      return data;
    },
  });
}

/** useCreateSaasPlan — Super Admin create plan */
export function useCreateSaasPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSaasPlanRequest) => {
      const { data } = await apiClient.post('/superadmin/saas-plans', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-plans'] });
    },
  });
}

/** useUpdateSaasPlan — Super Admin update plan */
export function useUpdateSaasPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSaasPlanRequest }) => {
      const { data } = await apiClient.put(`/superadmin/saas-plans/${id}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-plans'] });
    },
  });
}

/** useDeleteSaasPlan — Super Admin delete plan */
export function useDeleteSaasPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/superadmin/saas-plans/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-plans'] });
    },
  });
}

/** useUpdatePlatformConfig — Super Admin update discount % / UPI settings */
export function useUpdatePlatformConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdatePlatformConfigRequest) => {
      const { data } = await apiClient.put('/superadmin/platform-config', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-plans'] });
    },
  });
}

