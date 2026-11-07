import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDashboardStats } from '../hooks/useLibrary';
import {
  Users,
  Armchair,
  IndianRupee,
  CalendarCheck,
  AlertTriangle,
  Clock,
  CalendarDays,
  Sparkles,
  ArrowRight,
  UserPlus,
  PlusCircle,
  Layers,
} from 'lucide-react';
import { Card, StatCard, Badge, Button } from '../components/ui';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Glass Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-8 border">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="brand">
                <Sparkles className="h-3 w-3" /> Real-time Sync
              </Badge>
              <span className="text-xs text-slate-400">Library Control Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
              Welcome back, {user?.name}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl">
              Live operational dashboard for{' '}
              <strong className="text-indigo-400 font-semibold">{user?.tenantName}</strong>. 
              Track student admissions, seating occupancy, dues collection, and upcoming renewals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/students">
              <Button icon={<UserPlus className="h-4 w-4" />}>
                Register Student
              </Button>
            </Link>
            <Link to="/seats">
              <Button variant="outline" icon={<Armchair className="h-4 w-4" />}>
                Seat Map
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Row 1: High-level operational stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/students">
          <StatCard
            title="Total Students"
            value={isLoading ? '…' : (stats?.totalStudents ?? 0)}
            subtitle="Active members enrolled"
            icon={<Users className="h-5 w-5" />}
            accentColor="brand"
          />
        </Link>

        <Link to="/seats">
          <StatCard
            title="Occupied Desks"
            value={isLoading ? '…' : (stats?.occupiedSeats ?? 0)}
            subtitle={`${stats?.availableSeats ?? 0} desks vacant & ready`}
            icon={<Armchair className="h-5 w-5" />}
            accentColor="emerald"
          />
        </Link>

        <Link to="/students?tab=dues">
          <StatCard
            title="Dues Outstanding"
            value={isLoading ? '…' : `₹${((stats?.duesOutstandingPaise ?? 0) / 100).toFixed(0)}`}
            subtitle={`${stats?.dueMembersCount ?? 0} student(s) with pending dues`}
            icon={<IndianRupee className="h-5 w-5" />}
            accentColor="amber"
          />
        </Link>

        <Link to="/plans">
          <StatCard
            title="Active Plans"
            value={isLoading ? '…' : (stats?.totalPlans ?? 0)}
            subtitle="Shift & fee pricing structures"
            icon={<CalendarCheck className="h-5 w-5" />}
            accentColor="indigo"
          />
        </Link>
      </div>

      {/* Row 2: Urgent Expiry & Attention Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            Urgent Expiry & Renewal Alerts
          </h2>
          <span className="text-xs text-slate-500">Automated WhatsApp Reminders enabled</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link to="/students?tab=expiring_3">
            <Card hoverEffect className="border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="warning">Action Needed</Badge>
                  <p className="mt-3 text-3xl font-black text-amber-400">
                    {isLoading ? '…' : (stats?.expiringIn3DaysCount ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-slate-300 font-semibold">Expiring in 1-3 Days</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Send urgent renewal reminder</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/students?tab=expiring_7">
            <Card hoverEffect className="border-blue-500/30 bg-blue-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="brand">This Week</Badge>
                  <p className="mt-3 text-3xl font-black text-blue-400">
                    {isLoading ? '…' : (stats?.expiringIn7DaysCount ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-slate-300 font-semibold">Expiring in 7 Days</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Upcoming cycle renewals</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <CalendarDays className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/students?tab=expired">
            <Card hoverEffect className="border-rose-500/30 bg-rose-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="danger">Expired</Badge>
                  <p className="mt-3 text-3xl font-black text-rose-400">
                    {isLoading ? '…' : (stats?.expiredCount ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-slate-300 font-semibold">Expired Memberships</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Past validity / vacate seat</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Row 3: Seating & Quick Actions Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>Study Hall Seating</h3>
              <p className="text-xs text-slate-400">Inventory allocation status</p>
            </div>
            <Link to="/seats" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <span>View Map</span> <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-center">
              <p className="text-2xl font-black text-emerald-400">{stats?.availableSeats ?? 0}</p>
              <p className="text-xs font-medium text-slate-300 mt-1">Available</p>
            </div>
            <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/10 p-4 text-center">
              <p className="text-2xl font-black text-indigo-400">{stats?.occupiedSeats ?? 0}</p>
              <p className="text-xs font-medium text-slate-300 mt-1">Occupied</p>
            </div>
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-center">
              <p className="text-2xl font-black text-amber-400">{stats?.maintenanceSeats ?? 0}</p>
              <p className="text-xs font-medium text-slate-300 mt-1">Maintenance</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>Quick Management</h3>
              <p className="text-xs text-slate-400">Frequent library tasks</p>
            </div>
            <Link to="/students" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <span>Directory</span> <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/students">
              <Button size="sm" icon={<UserPlus className="h-3.5 w-3.5" />}>
                Register Student
              </Button>
            </Link>
            <Link to="/seats">
              <Button size="sm" variant="secondary" icon={<PlusCircle className="h-3.5 w-3.5" />}>
                Configure Desks
              </Button>
            </Link>
            <Link to="/plans">
              <Button size="sm" variant="outline" icon={<Layers className="h-3.5 w-3.5" />}>
                Manage Shifts & Plans
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
