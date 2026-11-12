import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRevenueStats } from '../hooks/useLibrary';
import {
  IndianRupee,
  TrendingUp,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { StatCard, Badge, CustomSelect, Pagination } from '../components/ui';
import { formatDateTime } from '../utils/date';

export function RevenuePage() {
  const { data: stats, isLoading } = useRevenueStats();
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter recent transactions
  const filteredTransactions = useMemo(() => {
    if (!stats?.recentTransactions) return [];
    if (methodFilter === 'all') return stats.recentTransactions;
    return stats.recentTransactions.filter((tx) => tx.paymentMethod === methodFilter);
  }, [stats?.recentTransactions, methodFilter]);

  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, page, pageSize]);

  // Max daily amount for normalizing chart heights
  const maxTrendAmount = useMemo(() => {
    if (!stats?.dailyTrends || stats.dailyTrends.length === 0) return 1;
    return Math.max(...stats.dailyTrends.map((d) => d.amountPaise), 1);
  }, [stats?.dailyTrends]);

  // Method label map
  const methodBadgeColors: Record<string, string> = {
    upi: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    cash: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    card: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    bank_transfer: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  };

  const methodIcons: Record<string, string> = {
    upi: '📱 UPI',
    cash: '💵 Cash',
    card: '💳 Card',
    bank_transfer: '🏦 Bank Transfer',
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl glass-panel p-5 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="brand">
                <Sparkles className="h-3 w-3" /> Financial Intelligence
              </Badge>
              <span className="text-xs text-slate-400">Real-time Collections</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Revenue & Fee Collections
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Track lifetime earnings, daily intake trends, pending dues collection, and payment mode breakdowns.
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link to="/students?tab=dues">
              <button
                type="button"
                className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:!text-white transition flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                <span>View Pending Dues ({stats?.dueStudentsCount || 0})</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Today's Collection"
          value={isLoading ? '…' : `₹${((stats?.todayRevenuePaise || 0) / 100).toLocaleString('en-IN')}`}
          icon={<IndianRupee className="h-5 w-5" />}
          subtitle="Live collections today"
          accentColor="emerald"
        />
        <StatCard
          title="This Month"
          value={isLoading ? '…' : `₹${((stats?.thisMonthRevenuePaise || 0) / 100).toLocaleString('en-IN')}`}
          icon={<Calendar className="h-5 w-5" />}
          subtitle={`Last Month: ₹${((stats?.lastMonthRevenuePaise || 0) / 100).toLocaleString('en-IN')}`}
          accentColor="indigo"
        />
        <StatCard
          title="Lifetime Collected"
          value={isLoading ? '…' : `₹${((stats?.totalRevenuePaise || 0) / 100).toLocaleString('en-IN')}`}
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle={`${stats?.totalTransactionsCount || 0} receipts issued`}
          accentColor="brand"
        />
        <StatCard
          title="Outstanding Dues"
          value={isLoading ? '…' : `₹${((stats?.duesOutstandingPaise || 0) / 100).toLocaleString('en-IN')}`}
          icon={<AlertCircle className="h-5 w-5" />}
          subtitle={`${stats?.dueStudentsCount || 0} members pending`}
          accentColor="amber"
        />
      </div>

      {/* Daily Trends & Payment Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* 14-Day Collection Trend Bar Chart (2 columns) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                14-Day Collection Trend
              </h2>
              <p className="text-xs text-slate-400">Daily fee revenue over the last 2 weeks</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg">
              Avg/Txn: ₹{((stats?.averagePaymentPaise || 0) / 100).toFixed(0)}
            </span>
          </div>

          {isLoading ? (
            <div className="h-52 flex items-center justify-center text-xs text-slate-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto mb-2" />
            </div>
          ) : !stats?.dailyTrends || stats.dailyTrends.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-xs text-slate-400">
              No recent collection data recorded.
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <div className="h-44 flex items-end gap-1.5 sm:gap-2 pt-6">
                {stats.dailyTrends.map((point) => {
                  const heightPercent = maxTrendAmount > 0
                    ? Math.max(6, Math.round((point.amountPaise / maxTrendAmount) * 100))
                    : 6;
                  const isToday = point === stats.dailyTrends[stats.dailyTrends.length - 1];

                  return (
                    <div
                      key={point.date}
                      className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg font-mono">
                        {point.label}: ₹{(point.amountPaise / 100).toFixed(0)} ({point.txnCount} txns)
                      </div>

                      {/* Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          isToday
                            ? 'bg-emerald-500 hover:bg-emerald-400'
                            : point.amountPaise > 0
                            ? 'bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-axis labels */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>{stats.dailyTrends[0]?.label}</span>
                <span>{stats.dailyTrends[Math.floor(stats.dailyTrends.length / 2)]?.label}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Today ({stats.dailyTrends[stats.dailyTrends.length - 1]?.label})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Payment Methods Breakdown (1 column) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4 shadow-sm">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Payment Methods
            </h2>
            <p className="text-xs text-slate-400">Distribution across payment channels</p>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading breakdown…</div>
          ) : (
            <div className="space-y-3.5">
              {stats?.paymentMethodBreakdown.map((item) => (
                <div key={item.method} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {methodIcons[item.method] || item.method.toUpperCase()}
                    </span>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ₹{(item.amountPaise / 100).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1.5">({item.percentage}%)</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className={`h-full rounded-full ${
                        item.method === 'upi'
                          ? 'bg-emerald-500'
                          : item.method === 'cash'
                          ? 'bg-amber-500'
                          : item.method === 'card'
                          ? 'bg-blue-500'
                          : 'bg-purple-500'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Total Transactions:</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
              {stats?.totalTransactionsCount || 0} receipts
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table & Audit Log */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Transactions ({filteredTransactions.length})
            </h2>
            <p className="text-xs text-slate-400">All issued receipts and fee logs</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-48">
              <CustomSelect
                value={methodFilter}
                onChange={setMethodFilter}
                options={[
                  { value: 'all', label: 'All Payment Modes' },
                  { value: 'upi', label: '📱 UPI Only' },
                  { value: 'cash', label: '💵 Cash Only' },
                  { value: 'card', label: '💳 Card Only' },
                  { value: 'bank_transfer', label: '🏦 Bank Transfer Only' },
                ]}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Desktop & Mobile Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Receipt #</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Txn Reference</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading transactions…
                  </td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {tx.receiptNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {tx.studentName}
                      {tx.membershipNumber && (
                        <span className="ml-1.5 text-[10px] text-slate-400 font-mono font-normal">
                          ({tx.membershipNumber})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
                          methodBadgeColors[tx.paymentMethod] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">
                      {tx.transactionRef || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{(tx.amountPaise / 100).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalItems={filteredTransactions.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
