import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Grid,
  CalendarClock,
  CreditCard,
  UserCheck,
  IndianRupee,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: '/revenue', label: 'Revenue & Billing', icon: <IndianRupee className="h-4 w-4" /> },
  { to: '/students', label: 'Students & Members', icon: <Users className="h-4 w-4" /> },
  { to: '/seats', label: 'Seating Map', icon: <Grid className="h-4 w-4" /> },
  { to: '/plans', label: 'Plans & Shifts', icon: <CalendarClock className="h-4 w-4" /> },
  { to: '/subscription', label: 'My Subscription', icon: <CreditCard className="h-4 w-4" /> },
  { to: '/profile', label: 'Profile & Settings', icon: <UserCheck className="h-4 w-4" /> },
];

export function Sidebar() {
  return (
    <aside
      className="hidden md:flex w-64 border-r flex-col justify-between p-4 z-10 select-none transition-colors duration-200"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="space-y-4">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            Operations
          </p>
          <nav className="mt-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[var(--brand-primary)] !text-white shadow-sm shadow-blue-950/25 font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <span className="opacity-80 group-hover:opacity-100">{item.icon}</span>
                  <span className="tracking-tight">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-[var(--brand-subtle)] px-2 py-0.5 text-[10px] text-[var(--brand-text)] font-semibold border border-blue-200 dark:border-blue-800">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Cloud Info Card */}
      <div
        className="rounded-2xl p-3.5 border shadow-xs relative overflow-hidden transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface-subtle)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2 text-[#1E3A8A] dark:text-blue-400">
          <img src="/apple-touch-icon.png?v=2" alt="AbhyasRoom" className="h-4 w-4 rounded-md object-contain" />
          <span className="text-[11px] font-bold uppercase tracking-wider">AbhyasRoom Cloud</span>
        </div>
        <p className="mt-1 text-[11px] text-[var(--text-tertiary)] leading-relaxed font-normal">
          abhyasroom.in · Multi-shift allocation, real-time desk sync & WhatsApp reminders.
        </p>
      </div>
    </aside>
  );
}
