import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { AuthUser, LoginRequest } from '@atlas/shared';

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
      navigate('/dashboard');
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
