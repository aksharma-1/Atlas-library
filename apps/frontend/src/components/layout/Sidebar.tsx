import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/seats', label: 'Seating Map', icon: '🪑' },
  { to: '/plans', label: 'Plans & Shifts', icon: '⚙️' },
  { to: '/students', label: 'Students', icon: '🎓', badge: 'Phase 4' },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-surface-700 bg-surface-800 flex flex-col justify-between p-4">
      <div className="space-y-1">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Management
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-surface-700 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded bg-surface-900 px-1.5 py-0.5 text-[10px] text-slate-400 border border-surface-700">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900/50 p-3 text-xs text-slate-400">
        <p className="font-semibold text-slate-300">Phase 3 Active</p>
        <p className="mt-0.5 text-[11px]">Seating map & library operational settings</p>
      </div>
    </aside>
  );
}
