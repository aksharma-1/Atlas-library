import { useState } from 'react';
import { useAuth, usePublicSaasPlans, useSubmitPaymentUtr } from '../hooks/useAuth';
import {
  CreditCard,
  Building,
  Armchair,
  Calendar,
  Sparkles,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { Card, Badge, Button, Modal } from '../components/ui';

export function SubscriptionPage() {
  const { user } = useAuth();
  const { data: plansData } = usePublicSaasPlans();
  const submitPaymentUtr = useSubmitPaymentUtr();

  // Modal & Upgrade Flow state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedTier, setSelectedTier] = useState<string>('growth');
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);

  const currentTier = user?.subscriptionTier || 'growth';
  const plans = plansData?.plans || [];
  const currentPlan = plans.find((p) => p.code === currentTier);

  const yearlyDiscount = plansData?.config?.yearlyDiscountPercent ?? 20;
  const platformUpiId = plansData?.config?.upiId || import.meta.env.VITE_PLATFORM_UPI_ID || 'abhyasroom@upi';
  const platformUpiName = plansData?.config?.upiName || import.meta.env.VITE_PLATFORM_UPI_NAME || 'AbhyasRoom';

  const expiresAt = user?.subscriptionExpiresAt
    ? new Date(user.subscriptionExpiresAt)
    : null;

  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 3600 * 24)))
    : null;

  // Selected plan calculation for upgrade modal
  const selectedPlan = plans.find((p) => p.code === selectedTier) || plans[0];

  const getPlanPrice = (monthlyPrice: number) => {
    if (billingCycle === 'yearly') {
      const discountedYearly = Math.round(monthlyPrice * 12 * (1 - yearlyDiscount / 100));
      return {
        amount: discountedYearly,
        display: `₹${discountedYearly.toLocaleString('en-IN')}`,
        period: '/ year',
        effectiveMonthly: `₹${Math.round(discountedYearly / 12).toLocaleString('en-IN')}/mo`,
      };
    }
    return {
      amount: monthlyPrice,
      display: `₹${monthlyPrice.toLocaleString('en-IN')}`,
      period: '/ month',
      effectiveMonthly: null,
    };
  };

  const selectedPriceInfo = selectedPlan ? getPlanPrice(selectedPlan.monthlyPrice) : { amount: 999, display: '₹999', period: '/ month' };

  const handleSubmitUpgradeUtr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setUtrError('Please enter a valid 12-digit UPI Reference / UTR Number');
      return;
    }
    setUtrError(null);
    submitPaymentUtr.mutate(
      { tier: selectedTier, utr: utrNumber.trim() },
      {
        onSuccess: () => {
          setShowPaymentStep(false);
          setShowUpgradeModal(false);
          setUtrNumber('');
        },
        onError: (err: any) => {
          setUtrError(err?.response?.data?.error || 'Failed to submit payment UTR');
        },
      },
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="border-b pb-5" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>
              Library SaaS Subscription
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Review your current plan tier, maximum desk quota, and validity status.
            </p>
          </div>
        </div>
      </div>

      {/* Active Subscription Summary Card */}
      <div className="rounded-3xl border glass-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-64 w-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-[#2563EB] flex items-center justify-center text-white shadow-lg shadow-blue-950/25">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-main)' }}>
                  {user?.tenantName}
                </h2>
                <p className="text-xs text-slate-400">Account Owner: {user?.name}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl p-3.5 border glass-card">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Plan</p>
                <p className="text-base font-extrabold text-[#1E3A8A] dark:text-blue-400 capitalize mt-0.5">
                  {user?.isTrial ? '🎉 14-Day Free Trial' : `${currentPlan?.name || currentTier} Tier`}
                </p>
              </div>

              <div className="rounded-2xl p-3.5 border glass-card">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Seat Inventory Limit</p>
                <p className="text-base font-extrabold mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                  <Armchair className="h-4 w-4 text-emerald-400" />
                  Up to {user?.maxSeats || currentPlan?.maxDesks || 150} Desks
                </p>
              </div>

              <div className="rounded-2xl p-3.5 border glass-card">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Status</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="success">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {user?.subscriptionStatus || 'Active'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Expiry / Renewal Card */}
          <div className="rounded-2xl p-6 border glass-card text-center md:text-right space-y-2 min-w-[240px]">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subscription Validity</p>
            {expiresAt ? (
              <>
                <p className="text-3xl font-black text-indigo-400">{daysRemaining} Days Left</p>
                <p className="text-xs text-slate-400 flex items-center justify-center md:justify-end gap-1">
                  <Calendar className="h-3 w-3" />
                  Renews {expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-emerald-400">Active / Unlimited</p>
            )}

            <div className="pt-3">
              <Button
                size="sm"
                variant="primary"
                className="w-full cursor-pointer"
                icon={<ArrowUpRight className="h-3.5 w-3.5" />}
                onClick={() => {
                  setShowPaymentStep(false);
                  setShowUpgradeModal(true);
                }}
              >
                Change or Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Included Platform Capabilities */}
      <div className="space-y-4">
        <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>
          Included Platform Capabilities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="space-y-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
              <Armchair className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
              Live Desk Map & Shifts
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive seating grid with real-time occupancy status, multi-shift timings, and reserved desk allocation.
            </p>
          </Card>

          <Card className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
              <Zap className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
              WhatsApp Renewal Engine
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              One-click instant payment due & renewal reminder messages sent directly to your students' WhatsApp.
            </p>
          </Card>

          <Card className="space-y-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit">
              <Sparkles className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
              Printable ID Cards & Receipts
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clean PDF generation for student identification cards and payment receipts with your library branding.
            </p>
          </Card>
        </div>
      </div>

      {/* ── MODAL: CHANGE OR UPGRADE PLAN ────────────────────────────────── */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          setShowPaymentStep(false);
          setUtrError(null);
        }}
        title={showPaymentStep ? 'Scan & Pay for Plan' : 'Change or Upgrade Subscription Plan'}
        subtitle={
          showPaymentStep
            ? `Submit UPI reference for ${selectedPlan?.name || 'Selected'} Plan`
            : 'Select a plan that matches your library capacity and features'
        }
        icon={<Sparkles className="h-5 w-5 text-indigo-500" />}
        maxWidth={showPaymentStep ? 'md' : 'xl'}
      >
        {!showPaymentStep ? (
          <div className="space-y-6">
            {/* Monthly vs Yearly Switch */}
            <div className="flex items-center justify-center">
              <div className="flex items-center bg-slate-100 dark:bg-slate-850 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    billingCycle === 'yearly'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Yearly Billing</span>
                  <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-500/30">
                    SAVE {yearlyDiscount}%
                  </span>
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
              {plans.map((p) => {
                const isSelected = selectedTier === p.code;
                const isCurrent = user?.subscriptionTier === p.code && !user?.isTrial;
                const priceInfo = getPlanPrice(p.monthlyPrice);

                return (
                  <div
                    key={p.code}
                    onClick={() => setSelectedTier(p.code)}
                    className={`relative rounded-2xl p-5 border flex flex-col justify-between cursor-pointer transition ${
                      isSelected
                        ? 'border-[#1E3A8A] dark:border-blue-500 bg-white dark:bg-slate-900 shadow-xl shadow-blue-950/10 ring-2 ring-[#1E3A8A]/30 dark:ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {p.isPopular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#F59E0B] px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-md whitespace-nowrap z-10">
                        Most Popular
                      </span>
                    )}

                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">{p.name}</h4>
                            {isCurrent && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                                Current
                              </span>
                            )}
                          </div>
                          {p.tagline && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {p.tagline}
                            </p>
                          )}
                        </div>
                        <input
                          type="radio"
                          name="upgradePlan"
                          checked={isSelected}
                          onChange={() => setSelectedTier(p.code)}
                          className="h-4 w-4 text-[#1E3A8A] dark:text-blue-500 cursor-pointer accent-[#1E3A8A] mt-1 shrink-0"
                        />
                      </div>

                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {priceInfo.display}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {priceInfo.period}
                          </span>
                        </div>
                        {priceInfo.effectiveMonthly && (
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                            {priceInfo.effectiveMonthly}
                          </p>
                        )}
                        <p className="text-xs font-semibold text-[#1E3A8A] dark:text-blue-400 mt-1">
                          Up to {p.maxDesks} Desks
                        </p>
                      </div>

                      <ul className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3.5 text-xs text-slate-700 dark:text-slate-300">
                        {p.features.map((f, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold leading-none mt-0.5">✓</span>
                            <span className="font-medium leading-tight">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTier(p.code);
                        setShowPaymentStep(true);
                      }}
                      className={`mt-5 w-full rounded-xl py-2.5 text-xs font-bold shadow transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#1E3A8A] dark:bg-blue-600 !text-white hover:bg-[#172554] dark:hover:bg-blue-500 shadow-blue-950/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-[#EEF2FF] hover:text-[#1E3A8A] dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent'
                      }`}
                    >
                      Scan QR & Pay {priceInfo.display} →
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentStep(true)}
                className="rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#172554] hover:to-[#1D4ED8] px-6 py-2.5 text-xs font-bold !text-white shadow-md shadow-blue-950/20 transition cursor-pointer"
              >
                Proceed to Payment ({selectedPlan?.name || 'Selected Plan'}) →
              </button>
            </div>
          </div>
        ) : (
          /* Payment Step with QR Code */
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Scan with any UPI App (<span className="text-[#1E3A8A] dark:text-blue-400 font-semibold">PhonePe, GPay, Paytm, BHIM</span>)
              </p>

              {/* Dynamic QR */}
              <div className="bg-white p-3 rounded-xl inline-block shadow-lg mx-auto border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `upi://pay?pa=${platformUpiId}&pn=${platformUpiName}&am=${selectedPriceInfo.amount}&cu=INR`,
                  )}`}
                  alt="UPI QR Code"
                  className="h-44 w-44 object-contain"
                />
              </div>

              <div className="text-center pt-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total Amount ({billingCycle === 'yearly' ? 'Annual Plan' : 'Monthly Plan'})
                </p>
                <p className="text-2xl font-black text-[#1E3A8A] dark:text-blue-400">
                  {selectedPriceInfo.display}{' '}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{selectedPriceInfo.period}</span>
                </p>
                <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-1">
                  UPI ID: <span className="text-slate-900 dark:text-white font-semibold">{platformUpiId}</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Payee: {platformUpiName}</p>
              </div>
            </div>

            {/* UTR Form */}
            <form onSubmit={handleSubmitUpgradeUtr} className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              {utrError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                  {utrError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-white mb-1">
                  Enter 12-Digit UPI Reference / UTR Number *
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 412389102847"
                  maxLength={16}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E3A8A] dark:focus:border-blue-500 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Find this 12-digit number in your PhonePe / Google Pay payment receipt.
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentStep(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  ← Back to Plans
                </button>
                <button
                  type="submit"
                  disabled={submitPaymentUtr.isPending}
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold !text-white hover:bg-emerald-500 shadow-md disabled:opacity-50 transition cursor-pointer"
                >
                  {submitPaymentUtr.isPending ? 'Submitting…' : 'Submit Reference & Activate →'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
