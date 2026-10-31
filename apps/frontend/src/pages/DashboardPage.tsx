import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../hooks/useAuth';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  sub?: string;
}

function StatCard({ label, value, icon, sub }: StatCardProps) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-800 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 text-3xl font-bold text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

/**
 * DashboardPage — the main admin overview screen.
 *
 * Phase 2: stat cards are static placeholders.
 * Phase 3: each card will fetch real data from the API.
 */
export function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppShell>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Welcome back, {user?.name}. Here's what's happening at{' '}
          <span className="text-brand-400">{user?.tenantName}</span>.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value="—"
          icon="🎓"
          sub="Phase 3 will populate this"
        />
        <StatCard
          label="Active Memberships"
          value="—"
          icon="✅"
          sub="Phase 3 will populate this"
        />
        <StatCard
          label="Seats Occupied"
          value="—"
          icon="💺"
          sub="Phase 3 will populate this"
        />
        <StatCard
          label="Dues Outstanding"
          value="—"
          icon="💰"
          sub="Phase 3 will populate this"
        />
      </div>

      {/* Coming soon panels */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-700 bg-surface-800 p-6">
          <h2 className="mb-4 text-base font-semibold text-white">
            Recent Registrations
          </h2>
          <p className="text-sm text-slate-500">
            Student registrations will appear here in Phase 3.
          </p>
        </div>

        <div className="rounded-xl border border-surface-700 bg-surface-800 p-6">
          <h2 className="mb-4 text-base font-semibold text-white">
            Expiring Memberships
          </h2>
          <p className="text-sm text-slate-500">
            Members expiring soon will appear here in Phase 3.
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-base font-semibold text-white">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '+ Register Student', disabled: true },
            { label: '+ Record Payment', disabled: true },
            { label: '+ Assign Seat', disabled: true },
          ].map((action) => (
            <button
              key={action.label}
              disabled={action.disabled}
              title="Available in Phase 3"
              className="rounded-lg border border-surface-600 bg-surface-700 px-4 py-2 text-sm text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-600">
          Quick actions will be enabled in Phase 3.
        </p>
      </div>
    </AppShell>
  );
}
