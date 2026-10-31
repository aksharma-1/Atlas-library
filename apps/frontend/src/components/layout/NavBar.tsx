import { useAuth, useLogout } from '../../hooks/useAuth';

/**
 * NavBar — top navigation bar shown in the authenticated app shell.
 * Displays the library name (from JWT) and a logout button.
 */
export function NavBar() {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-700 bg-surface-800 px-6 shadow-sm">
      {/* Brand / Library name */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">📚</span>
        <div>
          <p className="text-sm font-semibold leading-tight text-white">
            {user?.tenantName ?? 'Atlas Library'}
          </p>
          <p className="text-xs text-slate-400">Management System</p>
        </div>
      </div>

      {/* User info + logout */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-white">{user?.name}</p>
          <p className="text-xs capitalize text-slate-400">{user?.role}</p>
        </div>

        {/* Avatar initials */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
          {user?.name?.charAt(0).toUpperCase() ?? '?'}
        </div>

        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="rounded-md border border-surface-600 px-3 py-1.5 text-xs text-slate-300 transition hover:border-brand-500 hover:text-white disabled:opacity-50"
        >
          {logout.isPending ? 'Logging out…' : 'Logout'}
        </button>
      </div>
    </header>
  );
}
