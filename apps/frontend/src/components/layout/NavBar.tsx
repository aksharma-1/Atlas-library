import { useState } from 'react';
import { useAuth, useLogout } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, Shield, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConfirmModal } from '../ui';

export function NavBar() {
  const { user } = useAuth();
  const logout = useLogout();
  const { theme, toggleTheme } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b px-3.5 sm:px-6 glass-panel z-20 transition-colors">
      {/* Brand / Library name */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-[#1E3A8A] to-[#2563EB] flex items-center justify-center !text-white shadow-md shadow-blue-950/20 shrink-0 overflow-hidden">
          {user?.logoUrl ? (
            <img
              src={user.logoUrl}
              alt={user.tenantName || 'Library Logo'}
              className="h-full w-full object-cover rounded-xl"
            />
          ) : (
            <img
              src="/abhyasroom-logo.png?v=2"
              alt="AbhyasRoom"
              className="h-full w-full object-contain p-1 bg-white dark:bg-slate-900 rounded-xl"
            />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold leading-tight truncate" style={{ color: 'var(--text-main)' }}>
            {user?.role === 'superadmin' ? 'AbhyasRoom Platform' : (user?.tenantName ?? 'AbhyasRoom Library')}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 truncate">
            {user?.role === 'superadmin' ? 'Super Admin Portal' : 'abhyasroom.in Cloud OS'}
          </p>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Superadmin pill */}
        {user?.role === 'superadmin' && (
          <a
            href="/admin"
            className="rounded-xl bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500 hover:text-slate-900 transition flex items-center gap-1.5 shadow-sm"
          >
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Super Admin</span>
          </a>
        )}

        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="rounded-xl p-2 border transition border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-focus)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-600" />
          )}
        </button>

        {/* User profile info & link */}
        <div className="flex items-center gap-2 sm:gap-3 pl-1.5 sm:pl-2 border-l border-[var(--border-subtle)]">
          <Link
            to="/profile"
            title="View & Edit Profile"
            className="flex items-center gap-2 group hover:opacity-90 transition cursor-pointer"
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{user?.name}</p>
              <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">{user?.role}</p>
            </div>

            {/* Avatar initial */}
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-xs font-black !text-white text-white shadow-md group-hover:ring-2 group-hover:ring-indigo-500/50 transition">
              <span className="!text-white text-white font-black">
                {user?.name?.charAt(0).toUpperCase() ?? 'U'}
              </span>
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            disabled={logout.isPending}
            title="Log out"
            className="rounded-xl p-2 border transition border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-rose-500/10 hover:border-rose-500/30 text-[var(--text-tertiary)] hover:text-rose-500 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout.mutate();
        }}
        title="Sign Out"
        description="Are you sure you want to sign out of your account?"
        confirmLabel="Sign Out"
        cancelLabel="Stay Logged In"
        variant="danger"
        isLoading={logout.isPending}
      />
    </header>
  );
}
