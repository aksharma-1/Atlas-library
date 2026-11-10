import { Navigate } from 'react-router-dom';
import { useAuth, useLogout } from '../hooks/useAuth';
import { LogOut, ShieldAlert } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  allowPendingPayment?: boolean;
}

/**
 * ProtectedRoute — wraps pages that require authentication.
 *
 * - While session is loading → spinner
 * - Unauthenticated → redirects to /login
 * - SuperAdmin → full access
 * - Library account suspended (isActive === false) → Suspended Account Screen
 * - Subscription not active (pending_payment, pending_approval, expired) and route doesn't allow it → redirects to /onboarding
 * - Authenticated & Active → renders children
 */
export function ProtectedRoute({ children, allowPendingPayment = false }: Props) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const logout = useLogout();

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

  // SuperAdmin has platform master access everywhere
  if (user?.role === 'superadmin') {
    return <>{children}</>;
  }

  // Suspended library account gate
  if (user?.isActive === false) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-surface-800 p-8 text-center shadow-2xl space-y-5">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Library Account Suspended</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Access to <strong className="text-slate-200">{user?.tenantName || 'your library'}</strong> has been temporarily suspended by the platform administrator.
            </p>
          </div>
          <div className="rounded-xl border border-surface-700 bg-surface-900/60 p-4 text-left text-xs text-slate-400 space-y-1.5">
            <div className="flex justify-between">
              <span>Account:</span>
              <span className="font-semibold text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-semibold text-red-400">Suspended / Inactive</span>
            </div>
            <div className="flex justify-between">
              <span>Support:</span>
              <span className="text-brand-400 font-mono">akshaysharma58194@gmail.com</span>
            </div>
          </div>
          <button
            onClick={() => logout.mutate()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-surface-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-surface-600 transition"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Subscription Gate: If subscription is NOT active (e.g. pending_payment, pending_approval, past_due, cancelled)
  // and this page does not permit pending status (like /onboarding does), redirect to /onboarding
  if (!allowPendingPayment && user?.subscriptionStatus !== 'active') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
