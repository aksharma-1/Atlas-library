import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Props {
  children: React.ReactNode;
  allowPendingPayment?: boolean;
}

/**
 * ProtectedRoute — wraps pages that require authentication.
 *
 * - While session is loading → spinner
 * - Unauthenticated → redirects to /login
 * - Authenticated with pending payment (and not on onboarding) → redirects to /onboarding
 * - Authenticated → renders children
 */
export function ProtectedRoute({ children, allowPendingPayment = false }: Props) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Subscription Gate: If payment is pending and this page doesn't allow it, send to onboarding
  if (!allowPendingPayment && user?.subscriptionStatus === 'pending_payment') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
