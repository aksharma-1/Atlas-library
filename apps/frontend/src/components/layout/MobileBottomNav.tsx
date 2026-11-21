import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Grid, IndianRupee, UserCheck } from 'lucide-react';

interface BottomNavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const bottomNavItems: BottomNavItem[] = [
  { to: '/dashboard', label: 'Home', icon: <LayoutDashboard className="h-5 w-5" /> },
  { to: '/seats', label: 'Seats', icon: <Grid className="h-5 w-5" /> },
  { to: '/students', label: 'Students', icon: <Users className="h-5 w-5" /> },
  { to: '/revenue', label: 'Revenue', icon: <IndianRupee className="h-5 w-5" /> },
  { to: '/profile', label: 'Profile', icon: <UserCheck className="h-5 w-5" /> },
];

export function MobileBottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl transition-colors select-none shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.5)]"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-around px-1.5 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl min-h-[50px] transition-all duration-150 relative ${
                isActive
                  ? 'text-[#1E3A8A] dark:text-blue-400 font-bold bg-[#1E3A8A]/10 dark:bg-blue-500/15 shadow-xs'
                  : 'text-slate-500 hover:text-[#1E3A8A] dark:text-slate-400 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0.5 w-6 h-0.5 rounded-full bg-[#1E3A8A] dark:bg-blue-400" />
                )}
                <div className="mb-0.5">{item.icon}</div>
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
