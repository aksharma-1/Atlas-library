import { useAuth, useLogout } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, Shield, LogOut, BookOpen, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NavBar() {
  const { user } = useAuth();
  const logout = useLogout();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-16 items-center justify-between border-b px-6 glass-panel z-20">
      {/* Brand / Library name */}
      <div className="flex items-center gap-3.5">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-main)' }}>
            {user?.role === 'superadmin' ? 'StudySpace Platform' : (user?.tenantName ?? 'StudySpace Library')}
          </p>
          <p className="text-xs text-slate-400">
            {user?.role === 'superadmin' ? 'Super Admin Portal' : 'Smart Library Cloud OS'}
          </p>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-4">
        {/* Superadmin pill */}
        {user?.role === 'superadmin' && (
          <a
            href="/admin"
            className="rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500 hover:text-slate-900 transition flex items-center gap-1.5 shadow-sm"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Super Admin</span>
          </a>
        )}

        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="rounded-xl p-2 border transition glass-card hover:border-indigo-400/40 text-slate-300 hover:text-white cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400 animate-spin-slow" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-400" />
          )}
        </button>

        {/* User profile info & link */}
        <div className="flex items-center gap-3 pl-2 border-l" style={{ borderColor: 'var(--glass-border)' }}>
          <Link
            to="/profile"
            title="View & Edit Profile"
            className="flex items-center gap-2 group hover:opacity-90 transition cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold group-hover:text-indigo-400 transition" style={{ color: 'var(--text-main)' }}>{user?.name}</p>
              <p className="text-[10px] uppercase font-semibold text-indigo-400">{user?.role}</p>
            </div>

            {/* Avatar initial */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-xs font-extrabold text-white shadow-md group-hover:ring-2 group-hover:ring-indigo-500/50 transition">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
          </Link>

          {/* Quick Profile Icon Link (Mobile & Desktop) */}
          <Link
            to="/profile"
            title="Profile & Settings"
            className="rounded-xl p-2 border transition glass-card hover:border-indigo-400/40 text-slate-400 hover:text-indigo-400 cursor-pointer"
          >
            <User className="h-4 w-4" />
          </Link>

          {/* Logout */}
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            title="Log out"
            className="rounded-xl p-2 border transition glass-card hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
