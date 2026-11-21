import axios from 'axios';

export const AUTH_TOKEN_KEY = 'atlas_auth_token';

/**
 * Helper to get the stored JWT token (used for standalone PWA / iOS WebKit where cross-site cookies are blocked)
 */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Helper to persist the JWT token for PWA / iOS support
 */
export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // Ignore localStorage write failures in private browsing
  }
}

/**
 * Pre-configured Axios instance for all Atlas API calls.
 * - Base URL from VITE_API_BASE_URL env var
 * - withCredentials: true  → sends httpOnly auth cookie automatically in regular browsers
 * - Authorization header   → fallback for iOS PWA standalone WebViews where cross-site cookies are dropped
 */
export const apiClient = axios.create({
  baseURL: import.meta.env['VITE_API_BASE_URL'] as string,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer header if a token is present in storage
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

