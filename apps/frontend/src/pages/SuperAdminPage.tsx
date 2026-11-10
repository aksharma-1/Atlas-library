import { useState } from 'react';
import {
  useSuperAdminTenants,
  useApproveTenantSubscription,
  useToggleTenantStatus,
  useResetTenantPasswordByAdmin,
  useAuth,
  useLogout,
  useSuperAdminSaasPlans,
  useCreateSaasPlan,
  useUpdateSaasPlan,
  useDeleteSaasPlan,
  useUpdatePlatformConfig,
} from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, LogOut, Sparkles, ShieldCheck, Search, Building2, User, Phone, MapPin, Users } from 'lucide-react';
import type { SaasPlanDTO } from '@atlas/shared';
import { CustomSelect, Modal } from '../components/ui';

export function SuperAdminPage() {
  const { user } = useAuth();
  const logout = useLogout();
  const { theme, toggleTheme } = useTheme();
  const { data: tenants = [], isLoading: isTenantsLoading } = useSuperAdminTenants();
  const { data: saasData, isLoading: isPlansLoading } = useSuperAdminSaasPlans();

  const approveTenant = useApproveTenantSubscription();
  const toggleStatus = useToggleTenantStatus();
  const resetPasswordMutation = useResetTenantPasswordByAdmin();
  const createPlan = useCreateSaasPlan();
  const updatePlan = useUpdateSaasPlan();
  const deletePlan = useDeleteSaasPlan();
  const updatePlatformConfig = useUpdatePlatformConfig();

  // Navigation tab: Libraries vs Plans
  const [mainTab, setMainTab] = useState<'libraries' | 'plans' | 'settings'>('libraries');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantDetails, setSelectedTenantDetails] = useState<any | null>(null);

  // Library filters
  const [libraryFilter, setLibraryFilter] = useState<'pending' | 'active' | 'all'>('pending');
  const [approvalDays, setApprovalDays] = useState('30');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Admin Password Reset Modal State
  const [adminResetTenant, setAdminResetTenant] = useState<any | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminGeneratedOtp, setAdminGeneratedOtp] = useState<{ otp: string; email: string } | null>(null);

  // Plan Management Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaasPlanDTO | null>(null);

  // Form fields for create/edit plan
  const [planCode, setPlanCode] = useState('');
  const [planName, setPlanName] = useState('');
  const [planTagline, setPlanTagline] = useState('');
  const [planMonthlyPrice, setPlanMonthlyPrice] = useState('999');
  const [planMaxDesks, setPlanMaxDesks] = useState('150');
  const [planFeatures, setPlanFeatures] = useState('');
  const [planIsPopular, setPlanIsPopular] = useState(false);
  const [planSortOrder, setPlanSortOrder] = useState('1');
  const [planError, setPlanError] = useState<string | null>(null);

  // Discount & Config state
  const [yearlyDiscount, setYearlyDiscount] = useState<string>('20');
  const [configUpiId, setConfigUpiId] = useState('');
  const [configUpiName, setConfigUpiName] = useState('');
  const [configSuccess, setConfigSuccess] = useState(false);

  // Sync config when loaded
  const currentDiscount = saasData?.config?.yearlyDiscountPercent ?? 20;

  if (user?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
        <div className="bg-surface-800 p-8 rounded-xl border border-red-500/30 text-center max-w-md">
          <span className="text-4xl">🚫</span>
          <h1 className="text-lg font-bold text-white mt-2">Restricted Area</h1>
          <p className="text-xs text-slate-400 mt-1">
            This dashboard is exclusively accessible by Platform Super-Administrators.
          </p>
        </div>
      </div>
    );
  }

  const plans = saasData?.plans || [];
  const pendingTenants = tenants.filter(
    (t) => t.subscriptionStatus === 'pending_approval' || t.subscriptionStatus === 'pending_payment',
  );
  const activeTenants = tenants.filter((t) => t.subscriptionStatus === 'active');

  const filteredByStatus =
    libraryFilter === 'pending'
      ? pendingTenants
      : libraryFilter === 'active'
      ? activeTenants
      : tenants;

  const displayedTenants = filteredByStatus.filter((t) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.name?.toLowerCase().includes(query) ||
      t.ownerName?.toLowerCase().includes(query) ||
      t.ownerEmail?.toLowerCase().includes(query) ||
      t.phone?.toLowerCase().includes(query) ||
      t.city?.toLowerCase().includes(query) ||
      t.address?.toLowerCase().includes(query) ||
      t.lastUtrRef?.toLowerCase().includes(query)
    );
  });

  const handleApprove = (tenantId: string) => {
    approveTenant.mutate(
      {
        tenantId,
        days: parseInt(approvalDays, 10) || 30,
      },
      {
        onSuccess: () => {
          setSelectedTenantId(null);
        },
      },
    );
  };

  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanCode('');
    setPlanName('');
    setPlanTagline('');
    setPlanMonthlyPrice('999');
    setPlanMaxDesks('150');
    setPlanFeatures('Unlimited Members\nVisual Seating Map\nWhatsApp Reminders\nShift Scheduling');
    setPlanIsPopular(false);
    setPlanSortOrder(String(plans.length + 1));
    setPlanError(null);
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: SaasPlanDTO) => {
    setEditingPlan(plan);
    setPlanCode(plan.code);
    setPlanName(plan.name);
    setPlanTagline(plan.tagline || '');
    setPlanMonthlyPrice(String(plan.monthlyPrice));
    setPlanMaxDesks(String(plan.maxDesks));
    setPlanFeatures(plan.features.join('\n'));
    setPlanIsPopular(Boolean(plan.isPopular));
    setPlanSortOrder(String(plan.sortOrder || 0));
    setPlanError(null);
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    setPlanError(null);

    const price = parseInt(planMonthlyPrice, 10);
    const desks = parseInt(planMaxDesks, 10);
    const sort = parseInt(planSortOrder, 10) || 0;

    if (isNaN(price) || price < 0) {
      setPlanError('Monthly price must be a valid positive number');
      return;
    }
    if (isNaN(desks) || desks <= 0) {
      setPlanError('Desk capacity must be at least 1');
      return;
    }

    const featureList = planFeatures
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    if (editingPlan) {
      updatePlan.mutate(
        {
          id: editingPlan._id,
          updates: {
            name: planName.trim(),
            tagline: planTagline.trim(),
            monthlyPrice: price,
            maxDesks: desks,
            features: featureList,
            isPopular: planIsPopular,
            sortOrder: sort,
          },
        },
        {
          onSuccess: () => setIsPlanModalOpen(false),
          onError: (err: any) => setPlanError(err?.response?.data?.error || 'Failed to update plan'),
        },
      );
    } else {
      if (!planCode.trim()) {
        setPlanError('Plan code identifier is required (e.g. starter, growth, custom)');
        return;
      }
      createPlan.mutate(
        {
          code: planCode.trim().toLowerCase(),
          name: planName.trim(),
          tagline: planTagline.trim(),
          monthlyPrice: price,
          maxDesks: desks,
          features: featureList,
          isPopular: planIsPopular,
          sortOrder: sort,
        },
        {
          onSuccess: () => setIsPlanModalOpen(false),
          onError: (err: any) => setPlanError(err?.response?.data?.error || 'Failed to create plan'),
        },
      );
    }
  };

  const handleDeletePlan = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the plan "${name}"?`)) {
      deletePlan.mutate(id);
    }
  };

  const handleSavePlatformConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const discount = parseInt(yearlyDiscount, 10);
    if (isNaN(discount) || discount < 0 || discount > 90) {
      alert('Discount must be between 0% and 90%');
      return;
    }

    updatePlatformConfig.mutate(
      {
        yearlyDiscountPercent: discount,
        upiId: configUpiId.trim() || undefined,
        upiName: configUpiName.trim() || undefined,
      },
      {
        onSuccess: () => {
          setConfigSuccess(true);
          setTimeout(() => setConfigSuccess(false), 3000);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-700 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <h1 className="text-2xl font-black text-white">StudySpace OS — Super Admin</h1>
            <span className="bg-brand-600/30 text-brand-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-brand-500/40">
              Platform Master Panel
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervise all library registrations, customize subscription plans, and configure yearly discounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-surface-800 p-1 border border-surface-700">
            <button
              onClick={() => setMainTab('libraries')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                mainTab === 'libraries' ? 'bg-brand-600 !text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏛️</span> Libraries ({tenants.length})
            </button>
            <button
              onClick={() => setMainTab('plans')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                mainTab === 'plans' ? 'bg-brand-600 !text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>💳</span> SaaS Plans ({plans.length})
            </button>
            <button
              onClick={() => {
                setMainTab('settings');
                setYearlyDiscount(String(currentDiscount));
                setConfigUpiId(saasData?.config?.upiId || '');
                setConfigUpiName(saasData?.config?.upiName || '');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                mainTab === 'settings' ? 'bg-brand-600 !text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>⚙️</span> Discount & UPI
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="rounded-xl p-2.5 border transition glass-card text-slate-300 hover:text-white cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-400" />
            )}
          </button>

          {/* Superadmin Logout Button */}
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            title="Log out of Super Admin"
            className="rounded-xl p-2.5 border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: LIBRARIES SUPERVISION */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mainTab === 'libraries' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-surface-800 p-5 rounded-xl border border-surface-700">
              <p className="text-xs text-slate-400 uppercase font-semibold">Total Libraries</p>
              <p className="text-3xl font-black text-white mt-1">{tenants.length}</p>
            </div>
            <div className="bg-surface-800 p-5 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <p className="text-xs text-amber-400 uppercase font-semibold">Pending Approval</p>
              <p className="text-3xl font-black text-amber-300 mt-1">{pendingTenants.length}</p>
            </div>
            <div className="bg-surface-800 p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <p className="text-xs text-emerald-400 uppercase font-semibold">Active Subscriptions</p>
              <p className="text-3xl font-black text-emerald-300 mt-1">{activeTenants.length}</p>
            </div>
            <div className="bg-surface-800 p-5 rounded-xl border border-surface-700">
              <p className="text-xs text-slate-400 uppercase font-semibold">Configured Desks</p>
              <p className="text-3xl font-black text-brand-400 mt-1">
                {tenants.reduce((acc, t) => acc + (t.configuredSeats || 0), 0)}
              </p>
            </div>
          </div>

          {/* Sub Tab Filter & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-surface-700 pb-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLibraryFilter('pending')}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                  libraryFilter === 'pending'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-surface-800 text-slate-300 hover:bg-surface-700'
                }`}
              >
                <span>⏳</span> Pending Payment Approval ({pendingTenants.length})
              </button>
              <button
                onClick={() => setLibraryFilter('active')}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                  libraryFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-surface-800 text-slate-300 hover:bg-surface-700'
                }`}
              >
                <span>✓</span> Active Libraries ({activeTenants.length})
              </button>
              <button
                onClick={() => setLibraryFilter('all')}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                  libraryFilter === 'all'
                    ? 'bg-brand-600 text-white shadow'
                    : 'bg-surface-800 text-slate-300 hover:bg-surface-700'
                }`}
              >
                All Records ({tenants.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <input
                type="text"
                placeholder="Search owner, email, phone, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-900 border border-surface-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-surface-700 bg-surface-800 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-700/60 text-slate-300 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Library & Owner</th>
                  <th className="px-5 py-3.5">Plan / Desks</th>
                  <th className="px-5 py-3.5">UPI Payment Ref</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Expires On</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700">
                {isTenantsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      Loading libraries…
                    </td>
                  </tr>
                ) : displayedTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      No libraries found in this category.
                    </td>
                  </tr>
                ) : (
                  displayedTenants.map((t) => {
                    const isPending =
                      t.subscriptionStatus === 'pending_approval' || t.subscriptionStatus === 'pending_payment';
                    return (
                      <tr key={t._id} className="hover:bg-surface-700/30 transition">
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setSelectedTenantDetails(t)}
                            className="text-left group hover:opacity-80 transition cursor-pointer"
                          >
                            <p className="font-bold text-white text-sm group-hover:text-indigo-400 transition flex items-center gap-1.5">
                              <span>{t.name}</span>
                              <span className="text-[10px] text-slate-400 group-hover:underline">🔍 details</span>
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {t.ownerName} · {t.ownerEmail} {t.phone ? `· ${t.phone}` : ''}
                            </p>
                            {t.city && <span className="text-[10px] text-slate-400">📍 {t.city}</span>}
                          </button>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-brand-300 capitalize">
                            {t.subscriptionTier || 'growth'}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Max {t.maxSeats || 150} Desks ({t.configuredSeats || 0} created)
                          </p>
                        </td>

                        <td className="px-5 py-3.5">
                          {t.lastUtrRef ? (
                            <div className="space-y-0.5">
                              <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                {t.lastUtrRef}
                              </span>
                              {t.lastPaymentSubmittedAt && (
                                <p className="text-[10px] text-slate-400">
                                  {new Date(t.lastPaymentSubmittedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No UTR submitted</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              t.subscriptionStatus === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : t.subscriptionStatus === 'pending_approval'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                : 'bg-surface-700 text-slate-400'
                            }`}
                          >
                            {t.subscriptionStatus.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-slate-300">
                          {t.subscriptionExpiresAt ? (
                            <div>
                              <p className="font-semibold text-white">
                                {new Date(t.subscriptionExpiresAt).toLocaleDateString()}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {Math.ceil(
                                  (new Date(t.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 3600 * 24),
                                )}{' '}
                                days left
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right space-x-2">
                          {isPending ? (
                            <button
                              onClick={() => setSelectedTenantId(t._id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg shadow transition"
                            >
                              ✓ Approve Payment
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedTenantId(t._id)}
                              className="bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white px-2.5 py-1 rounded text-xs transition"
                            >
                              + Extend Validity
                            </button>
                          )}

                          <button
                            onClick={() => toggleStatus.mutate({ tenantId: t._id, isActive: !t.isActive })}
                            className={`px-2.5 py-1 rounded text-xs transition ${
                              t.isActive ? 'text-red-400 hover:bg-red-500/20' : 'text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            {t.isActive ? 'Suspend' : 'Unsuspend'}
                          </button>

                          <button
                            onClick={() => {
                              setAdminResetTenant(t);
                              setAdminNewPassword('');
                              setAdminGeneratedOtp(null);
                            }}
                            title="Reset Client Password or Generate Recovery OTP"
                            className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-2.5 py-1 rounded text-xs transition font-semibold"
                          >
                            🔑 Reset Password
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: SAAS SUBSCRIPTION PLANS MANAGEMENT */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mainTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Platform Subscription Tiers</h2>
              <p className="text-xs text-slate-400">
                Create, update, or remove plans shown to new libraries during onboarding.
              </p>
            </div>
            <button
              onClick={handleOpenCreatePlan}
              className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-brand-500 transition flex items-center gap-1.5"
            >
              <span>+</span> Add New Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isPlansLoading ? (
              <div className="col-span-3 text-center py-12 text-slate-400">Loading plans…</div>
            ) : (
              plans.map((p) => {
                const discountedYearly = Math.round(p.monthlyPrice * 12 * (1 - currentDiscount / 100));

                return (
                  <div
                    key={p._id}
                    className="rounded-2xl border border-surface-700 bg-surface-800 p-6 flex flex-col justify-between relative shadow-xl"
                  >
                    {p.isPopular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                        Most Popular
                      </span>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold text-white">{p.name}</h3>
                          <span className="text-[10px] font-mono bg-surface-700 text-slate-300 px-2 py-0.5 rounded">
                            code: {p.code}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            p.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {p.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      {p.tagline && <p className="text-xs text-slate-400 italic">{p.tagline}</p>}

                      <div className="border-y border-surface-700/60 py-3 space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-white">₹{p.monthlyPrice}</span>
                          <span className="text-xs text-slate-400">/ month</span>
                        </div>
                        <p className="text-[11px] text-emerald-400 font-medium">
                          ₹{discountedYearly}/year with {currentDiscount}% annual discount
                        </p>
                        <p className="text-xs font-semibold text-brand-400">Capacity: Up to {p.maxDesks} Desks</p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-300 uppercase">Features Included:</p>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {p.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="text-emerald-400">✓</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-surface-700/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenEditPlan(p)}
                        className="flex-1 rounded-lg bg-surface-700 py-2 text-xs font-semibold text-slate-200 hover:bg-surface-600 transition"
                      >
                        Edit Plan
                      </button>
                      <button
                        onClick={() => handleDeletePlan(p._id, p.name)}
                        className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: PLATFORM DISCOUNT & UPI CONFIGURATION */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mainTab === 'settings' && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-surface-700 bg-surface-800 p-8 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>⚙️</span> Platform Billing & Discount Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure the global annual discount percentage and UPI account details shown on the checkout screen.
            </p>
          </div>

          {configSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-semibold">
              ✓ Platform billing settings saved successfully!
            </div>
          )}

          <form onSubmit={handleSavePlatformConfig} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-white">Yearly Discount Percentage (%)</label>
              <div className="flex items-center gap-3 mt-1.5">
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={yearlyDiscount}
                  onChange={(e) => setYearlyDiscount(e.target.value)}
                  className="w-32 rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm font-bold text-white focus:border-brand-500"
                  required
                />
                <span className="text-sm font-black text-emerald-400">% Discount</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                When a library switches to "Yearly Billing" on the onboarding screen, this discount will be automatically applied.
              </p>
            </div>

            <div className="border-t border-surface-700 pt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-white">Platform UPI ID (Receiving Account)</label>
                <input
                  type="text"
                  value={configUpiId}
                  onChange={(e) => setConfigUpiId(e.target.value)}
                  placeholder="e.g. 9876543210@paytm or studyspace@upi"
                  className="mt-1 w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm font-mono text-white placeholder-slate-500 focus:border-brand-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  UPI ID encoded in the QR code when libraries make their subscription payments.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-white">Payee / Business Display Name</label>
                <input
                  type="text"
                  value={configUpiName}
                  onChange={(e) => setConfigUpiName(e.target.value)}
                  placeholder="e.g. StudySpace OS Platform"
                  className="mt-1 w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Name shown on the user's Google Pay / PhonePe transaction confirmation.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updatePlatformConfig.isPending}
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-brand-500 disabled:opacity-50"
              >
                {updatePlatformConfig.isPending ? 'Saving Settings…' : 'Save Platform Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: CREATE / EDIT SAAS PLAN */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create New Subscription Plan'}
        subtitle="Configure SaaS subscription parameters, desk caps, and pricing"
        icon={<Sparkles className="h-5 w-5" />}
        maxWidth="lg"
      >
        <div>
          {planError && (
            <p className="text-xs text-rose-500 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 mb-4">{planError}</p>
          )}

          <form onSubmit={handleSavePlan} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Plan Code Identifier *</label>
                <input
                  type="text"
                  value={planCode}
                  disabled={!!editingPlan}
                  onChange={(e) => setPlanCode(e.target.value)}
                  placeholder="e.g. starter, pro, mega"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Display Name *</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Starter Space"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tagline / Short Pitch</label>
              <input
                type="text"
                value={planTagline}
                onChange={(e) => setPlanTagline(e.target.value)}
                placeholder="e.g. Ideal for small libraries and independent study rooms"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monthly Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  value={planMonthlyPrice}
                  onChange={(e) => setPlanMonthlyPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Desks Limit *</label>
                <input
                  type="number"
                  min="1"
                  value={planMaxDesks}
                  onChange={(e) => setPlanMaxDesks(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Display Sort Order</label>
                <input
                  type="number"
                  value={planSortOrder}
                  onChange={(e) => setPlanSortOrder(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Features (One per line)
              </label>
              <textarea
                rows={4}
                value={planFeatures}
                onChange={(e) => setPlanFeatures(e.target.value)}
                placeholder="Up to 50 Desks Capacity&#10;Unlimited Students&#10;WhatsApp Reminders"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white font-mono placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPopular"
                checked={planIsPopular}
                onChange={(e) => setPlanIsPopular(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isPopular" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                Mark as "Most Popular" badge in pricing table
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createPlan.isPending || updatePlan.isPending}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold !text-white shadow hover:bg-indigo-500 disabled:opacity-50"
              >
                {createPlan.isPending || updatePlan.isPending
                  ? 'Saving…'
                  : editingPlan
                  ? 'Update Plan'
                  : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Library & User Details Drawer / Modal */}
      <Modal
        isOpen={!!selectedTenantDetails}
        onClose={() => setSelectedTenantDetails(null)}
        title="Library & User Profile Details"
        subtitle={`Registered library credentials and operational profile for ${selectedTenantDetails?.name || ''}`}
        icon={<Building2 className="h-5 w-5 text-indigo-400" />}
        maxWidth="md"
      >
        {selectedTenantDetails && (
          <div className="space-y-5 text-xs">
            {/* Library Identity Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-indigo-500" />
                    {selectedTenantDetails.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Slug: {selectedTenantDetails.slug}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedTenantDetails.isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {selectedTenantDetails.isActive ? 'Active' : 'Suspended'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">City / Location</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {selectedTenantDetails.city || 'Not specified'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Library Phone</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {selectedTenantDetails.phone || 'Not specified'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Physical Address</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                    {selectedTenantDetails.address || 'No physical address configured yet'}
                  </p>
                </div>
              </div>
            </div>

            {/* Owner & Account User Info */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-indigo-500" />
                Library Owner Account
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Owner Name</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedTenantDetails.ownerName}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Login Email</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedTenantDetails.ownerEmail}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Registered On</span>
                  <p className="font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                    {selectedTenantDetails.createdAt ? new Date(selectedTenantDetails.createdAt).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Enrolled Students</span>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {selectedTenantDetails.totalStudents ?? 0} Students
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription & Desks Capacity */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Subscription & Capacity
              </h4>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Tier</span>
                  <span className="text-xs font-bold capitalize text-indigo-500">{selectedTenantDetails.subscriptionTier || 'Starter'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Desks Configured</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {selectedTenantDetails.configuredSeats || 0} / {selectedTenantDetails.maxSeats || 150}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Status</span>
                  <span className="text-xs font-bold text-emerald-500 uppercase">{selectedTenantDetails.subscriptionStatus}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTenantDetails(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Approval / Extension Modal */}
      <Modal
        isOpen={!!selectedTenantId}
        onClose={() => setSelectedTenantId(null)}
        title="Approve & Activate Subscription"
        subtitle="Verify that the UPI transfer arrived in your account, then confirm validity duration"
        icon={<ShieldCheck className="h-5 w-5" />}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <CustomSelect
              label="Grant Subscription Duration"
              value={approvalDays}
              onChange={(val) => setApprovalDays(val)}
              options={[
                { value: '30', label: '30 Days (1 Month)' },
                { value: '60', label: '60 Days (2 Months)' },
                { value: '90', label: '90 Days (Quarterly)' },
                { value: '365', label: '365 Days (Annual)' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setSelectedTenantId(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedTenantId && handleApprove(selectedTenantId)}
              disabled={approveTenant.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 !text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow disabled:opacity-50"
            >
              {approveTenant.isPending ? 'Activating…' : 'Confirm & Unlock Library'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Admin Password Reset Modal */}
      <Modal
        isOpen={!!adminResetTenant}
        onClose={() => setAdminResetTenant(null)}
        title="Admin Password Recovery & Reset"
        subtitle={`Reset credentials for library: ${adminResetTenant?.name || ''}`}
        icon={<ShieldCheck className="h-5 w-5 text-indigo-400" />}
        maxWidth="md"
      >
        {adminResetTenant && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
              <div>
                <span className="text-slate-400">Library:</span>{' '}
                <strong className="text-slate-900 dark:text-white">{adminResetTenant.name}</strong>
              </div>
              <div>
                <span className="text-slate-400">Owner Name:</span>{' '}
                <strong className="text-slate-900 dark:text-white">{adminResetTenant.ownerName}</strong>
              </div>
              <div>
                <span className="text-slate-400">Login Email:</span>{' '}
                <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{adminResetTenant.ownerEmail}</strong>
              </div>
            </div>

            {adminGeneratedOtp ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-2">
                <p className="text-xs font-semibold">
                  ✓ One-time recovery code generated for <span className="underline">{adminGeneratedOtp.email}</span>:
                </p>
                <div className="text-center py-2 bg-emerald-950/40 rounded-lg border border-emerald-500/20">
                  <span className="text-2xl font-mono font-black tracking-widest text-white">
                    {adminGeneratedOtp.otp}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-300">
                  Provide this 6-digit code to the library owner. They can enter it on the "Forgot Password" page to choose their new password.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Option 1: Set New Password Directly
                  </label>
                  <input
                    type="text"
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="Enter new temporary password (min 6 chars)"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Instantly updates the password in database without needing any OTP.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  <span className="text-[10px] uppercase font-bold text-slate-400">OR</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Option 2: Generate 6-Digit OTP Code
                  </label>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Generate a secure 6-digit OTP that only you can see, then convey it to the client via phone or WhatsApp.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAdminResetTenant(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Close
              </button>

              {!adminGeneratedOtp && (
                <>
                  <button
                    type="button"
                    disabled={resetPasswordMutation.isPending}
                    onClick={() => {
                      resetPasswordMutation.mutate(
                        { tenantId: adminResetTenant._id },
                        {
                          onSuccess: (data) => {
                            if (data.otp && data.ownerEmail) {
                              setAdminGeneratedOtp({ otp: data.otp, email: data.ownerEmail });
                            }
                          },
                        },
                      );
                    }}
                    className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold px-3.5 py-2 rounded-xl text-xs transition disabled:opacity-50"
                  >
                    Generate OTP Code
                  </button>

                  <button
                    type="button"
                    disabled={resetPasswordMutation.isPending || adminNewPassword.trim().length < 6}
                    onClick={() => {
                      resetPasswordMutation.mutate(
                        { tenantId: adminResetTenant._id, newPassword: adminNewPassword.trim() },
                        {
                          onSuccess: (data) => {
                            alert(data.message);
                            setAdminResetTenant(null);
                          },
                        },
                      );
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 !text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow disabled:opacity-50"
                  >
                    {resetPasswordMutation.isPending ? 'Updating…' : 'Save Direct Password'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
