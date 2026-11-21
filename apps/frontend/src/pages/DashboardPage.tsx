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
  TrendingUp,
} from 'lucide-react';
import { Card, StatCard, Badge, Button, StatCardSkeleton, Skeleton } from '../components/ui';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[var(--bg-surface)] p-6 sm:p-8 border border-[var(--border-subtle)] shadow-[var(--shadow-card)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="brand" icon={<Sparkles className="h-3 w-3" />}>
                Real-time Sync
              </Badge>
              <span className="text-xs text-[var(--text-tertiary)] font-medium">Library Control Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[var(--text-primary)]">
              Welcome back, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl font-normal leading-relaxed">
              Live operational dashboard for{' '}
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{user?.tenantName}</strong>. 
              Track student admissions, seating occupancy, dues collection, and upcoming renewals.
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <Link to="/students" className="flex-1 md:flex-initial">
              <Button icon={<UserPlus className="h-4 w-4" />} className="w-full justify-center">
                Register Student
              </Button>
            </Link>
            <Link to="/seats" className="flex-1 md:flex-initial">
              <Button variant="outline" icon={<Armchair className="h-4 w-4" />} className="w-full justify-center">
                Seat Map
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Row 1: High-level operational stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
          <Link to="/students">
            <StatCard
              title="Total Students"
              value={stats?.totalStudents ?? 0}
              subtitle="Active members enrolled"
              icon={<Users className="h-5 w-5" />}
              accentColor="brand"
            />
          </Link>

          <Link to="/seats">
            <StatCard
              title="Occupied Desks"
              value={stats?.occupiedSeats ?? 0}
              subtitle={`${stats?.availableSeats ?? 0} desks vacant & ready`}
              icon={<Armchair className="h-5 w-5" />}
              accentColor="emerald"
            />
          </Link>

          <Link to="/revenue">
            <StatCard
              title="Dues Outstanding"
              value={`₹${((stats?.duesOutstandingPaise ?? 0) / 100).toFixed(0)}`}
              subtitle={`${stats?.dueMembersCount ?? 0} pending • ₹${(((stats?.todayRevenuePaise ?? 0) / 100).toFixed(0))} collected today`}
              icon={<IndianRupee className="h-5 w-5" />}
              accentColor="amber"
            />
          </Link>

          <Link to="/plans">
            <StatCard
              title="Active Plans"
              value={stats?.totalPlans ?? 0}
              subtitle="Shift & fee pricing structures"
              icon={<CalendarCheck className="h-5 w-5" />}
              accentColor="indigo"
            />
          </Link>
        </div>
      )}

      {/* Row 2: Urgent Expiry & Attention Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Urgent Expiry & Renewal Alerts
          </h2>
          <span className="text-xs text-[var(--text-muted)] font-medium">Automated WhatsApp Reminders enabled</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--bg-surface)] p-5 border border-[var(--border-subtle)] animate-pulse space-y-3">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3.5 w-32" />
            </div>
            <div className="rounded-2xl bg-[var(--bg-surface)] p-5 border border-[var(--border-subtle)] animate-pulse space-y-3">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3.5 w-32" />
            </div>
            <div className="rounded-2xl bg-[var(--bg-surface)] p-5 border border-[var(--border-subtle)] animate-pulse space-y-3">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link to="/students?tab=expiring_3">
              <Card hoverEffect className="border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="warning">Action Needed</Badge>
                    <p className="mt-3 text-3xl font-black text-amber-600 dark:text-amber-400">
                      {stats?.expiringIn3DaysCount ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-primary)] font-bold">Expiring in 1-3 Days</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Send urgent renewal reminder</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/students?tab=expiring_7">
              <Card hoverEffect className="border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="brand">This Week</Badge>
                    <p className="mt-3 text-3xl font-black text-indigo-600 dark:text-indigo-400">
                      {stats?.expiringIn7DaysCount ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-primary)] font-bold">Expiring in 7 Days</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Upcoming cycle renewals</p>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/students?tab=expired">
              <Card hoverEffect className="border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="danger">Expired</Badge>
                    <p className="mt-3 text-3xl font-black text-rose-600 dark:text-rose-400">
                      {stats?.expiredCount ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-primary)] font-bold">Expired Memberships</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Past validity / vacate seat</p>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        )}
      </div>

      {/* Row 3: Seating & Quick Actions Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Study Hall Seating</h3>
              <p className="text-xs text-[var(--text-tertiary)] font-normal">Inventory allocation status</p>
            </div>
            <Link to="/seats" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              <span>View Map</span> <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
            <div className="rounded-2xl border border-emerald-300 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/10 p-3 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">{stats?.availableSeats ?? 0}</p>
              <p className="text-[11px] sm:text-xs font-bold text-emerald-950 dark:text-emerald-200 mt-1 truncate">Available</p>
            </div>
            <div className="rounded-2xl border border-[#1E3A8A]/30 dark:border-blue-500/25 bg-[#EEF2FF] dark:bg-blue-950/30 p-3 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-black text-[#1E3A8A] dark:text-blue-300">{stats?.occupiedSeats ?? 0}</p>
              <p className="text-[11px] sm:text-xs font-bold text-[#1E3A8A] dark:text-blue-200 mt-1 truncate">Occupied</p>
            </div>
            <div className="rounded-2xl border border-amber-300 dark:border-amber-500/25 bg-amber-50 dark:bg-amber-500/10 p-3 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400">{stats?.maintenanceSeats ?? 0}</p>
              <p className="text-[11px] sm:text-xs font-bold text-amber-950 dark:text-amber-200 mt-1 truncate">Maintenance</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Quick Management</h3>
              <p className="text-xs text-[var(--text-tertiary)] font-normal">Frequent library tasks</p>
            </div>
            <Link to="/students" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
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
            <Link to="/revenue">
              <Button size="sm" variant="secondary" icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}>
                Revenue Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
