import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Grid,
  CalendarClock,
  CreditCard,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: '/students', label: 'Students & Members', icon: <Users className="h-4 w-4" /> },
  { to: '/seats', label: 'Seating Map', icon: <Grid className="h-4 w-4" /> },
  { to: '/plans', label: 'Plans & Shifts', icon: <CalendarClock className="h-4 w-4" /> },
  { to: '/subscription', label: 'My Subscription', icon: <CreditCard className="h-4 w-4" /> },
];

export function Sidebar() {
  return (
    <aside
      className="w-64 border-r flex flex-col justify-between p-4 z-10 select-none transition-colors duration-200"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="space-y-4">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                      ? 'bg-indigo-600 !text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <span className="opacity-80 group-hover:opacity-100">{item.icon}</span>
                  <span className="tracking-tight">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
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
        className="rounded-xl p-3.5 border shadow-sm relative overflow-hidden transition-colors"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Sparkles className="h-4 w-4" />
          <span className="text-[11px] font-bold uppercase tracking-wider">StudySpace Cloud</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
          Automated multi-shift allocation, real-time desk sync & WhatsApp reminders.
        </p>
      </div>
    </aside>
  );
}
