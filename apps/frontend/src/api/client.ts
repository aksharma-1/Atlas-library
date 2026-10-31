import axios from 'axios';

/**
 * Pre-configured Axios instance for all Atlas API calls.
 * - Base URL from VITE_API_BASE_URL env var
 * - withCredentials: true  → sends httpOnly auth cookie automatically
 */
export const apiClient = axios.create({
  baseURL: import.meta.env['VITE_API_BASE_URL'] as string,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
