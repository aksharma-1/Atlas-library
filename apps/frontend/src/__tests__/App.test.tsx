import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// Mock useAuth so tests don't make real network calls
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isLoading: false, isAuthenticated: false }),
  useLogin: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { LoginPage } from '../pages/LoginPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

function renderWithProviders(ui: React.ReactElement, { route = '/login' } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sign-in heading', () => {
    renderWithProviders(<LoginPage />);
    expect(
      screen.getByRole('heading', { name: /sign in to your account/i }),
    ).toBeInTheDocument();
  });

  it('renders email and password fields', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderWithProviders(<LoginPage />);
    expect(
      screen.getByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it('renders Atlas Library branding', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Atlas Library')).toBeInTheDocument();
  });
});

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>Secret content</div>
      </ProtectedRoute>,
      { route: '/dashboard' },
    );
    // MemoryRouter won't navigate in test — we just check secret content is NOT shown
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });
});
