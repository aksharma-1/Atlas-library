import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDashboardStats } from '../hooks/useLibrary';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  sub?: string;
  color?: string;
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

export function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-slate-400">
          Welcome back, {user?.name}. Here's what's happening at{' '}
          <span className="text-brand-400 font-semibold">{user?.tenantName}</span>.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Registered Students"
          value={isLoading ? '…' : (stats?.totalStudents ?? 0)}
          icon="🎓"
          sub="Enrolled library members"
        />
        <StatCard
          label="Occupied Desks"
          value={isLoading ? '…' : (stats?.occupiedSeats ?? 0)}
          icon="🪑"
          sub={`${stats?.availableSeats ?? 0} desks available`}
        />
        <StatCard
          label="Dues Outstanding"
          value={isLoading ? '…' : `₹${((stats?.duesOutstandingPaise ?? 0) / 100).toFixed(0)}`}
          icon="💳"
          sub="Pending fee collections"
        />
        <StatCard
          label="Active Plans"
          value={isLoading ? '…' : (stats?.totalPlans ?? 0)}
          icon="📜"
          sub="Configured library tiers"
        />
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-700 bg-surface-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Seating Overview</h2>
            <Link to="/seats" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
              Open Seating Map →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
              <p className="text-2xl font-bold text-emerald-400">{stats?.availableSeats ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Available</p>
            </div>
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-2xl font-bold text-blue-400">{stats?.occupiedSeats ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Occupied</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-2xl font-bold text-amber-400">{stats?.maintenanceSeats ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Maintenance</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-surface-700 bg-surface-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Quick Actions</h2>
            <Link to="/students" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
              View Students →
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/students"
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-500 transition"
            >
              + Register Student
            </Link>
            <Link
              to="/seats"
              className="rounded-lg border border-surface-600 bg-surface-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-surface-600 hover:text-white transition"
            >
              + Bulk Add Seats
            </Link>
            <Link
              to="/plans"
              className="rounded-lg border border-surface-600 bg-surface-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-surface-600 hover:text-white transition"
            >
              + Add Membership Plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
