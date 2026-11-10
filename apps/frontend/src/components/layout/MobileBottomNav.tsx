import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Grid, CalendarClock, UserCheck } from 'lucide-react';

interface BottomNavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const bottomNavItems: BottomNavItem[] = [
  { to: '/dashboard', label: 'Home', icon: <LayoutDashboard className="h-5 w-5" /> },
  { to: '/students', label: 'Students', icon: <Users className="h-5 w-5" /> },
  { to: '/seats', label: 'Seats', icon: <Grid className="h-5 w-5" /> },
  { to: '/plans', label: 'Plans', icon: <CalendarClock className="h-5 w-5" /> },
  { to: '/profile', label: 'Profile', icon: <UserCheck className="h-5 w-5" /> },
];

export function MobileBottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-lg transition-colors select-none"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-1.5 safe-area-pb">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-semibold transition-all duration-150 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`
            }
          >
            <div className="mb-0.5">{item.icon}</div>
            <span className="truncate tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
