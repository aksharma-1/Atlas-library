import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import {
  useAuth,
  useConfigureLibrary,
  useSubmitPaymentUtr,
  useStartFreeTrial,
  useLogout,
  usePublicSaasPlans,
} from '../hooks/useAuth';
import { ConfirmModal, Logo } from '../components/ui';
import { Sparkles, Zap } from 'lucide-react';

export function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const configureLibrary = useConfigureLibrary();
  const submitPaymentUtr = useSubmitPaymentUtr();
  const startFreeTrial = useStartFreeTrial();
  const logout = useLogout();
  const { data: plansData, isLoading: isPlansLoading } = usePublicSaasPlans();

  // Billing cycle state
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Step 2 Form
  const [capacity, setCapacity] = useState('50');
  const [defaultShifts, setDefaultShifts] = useState(true);

  // Step 3 Subscription
  const [selectedTier, setSelectedTier] = useState<string>('growth');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);

  if (isLoading || isPlansLoading) {
    return <div className="min-h-screen bg-surface-900 flex items-center justify-center text-white">Loading…</div>;
  }

  // If already active, go to dashboard
  if (user && user.subscriptionStatus === 'active') {
    return <Navigate to="/dashboard" replace />;
  }

  const yearlyDiscount = plansData?.config?.yearlyDiscountPercent ?? 20;
  const platformUpiId = plansData?.config?.upiId || import.meta.env.VITE_PLATFORM_UPI_ID || 'abhyasroom@upi';
  const platformUpiName = plansData?.config?.upiName || import.meta.env.VITE_PLATFORM_UPI_NAME || 'AbhyasRoom';

  const isPendingApproval = user?.subscriptionStatus === 'pending_approval';
  const step = user?.onboardingStep === 'subscription' ? 3 : 2;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    configureLibrary.mutate({
      capacity: parseInt(capacity, 10) || 50,
      defaultShifts,
    });
  };

  const handleSubmitUtr = (e: React.FormEvent) => {
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
          setShowPaymentModal(false);
        },
      },
    );
  };

  const rawPlans = plansData?.plans || [];
  const selectedPlan = rawPlans.find((p) => p.code === selectedTier) || rawPlans[0];

  // Price calculations based on Monthly vs Yearly
  const getPlanPrice = (monthlyPrice: number) => {
    if (billingCycle === 'yearly') {
      const discountedYearly = Math.round(monthlyPrice * 12 * (1 - yearlyDiscount / 100));
      return {
        amount: discountedYearly,
        display: `₹${discountedYearly.toLocaleString('en-IN')}`,
        period: '/ year',
        effectiveMonthly: `₹${Math.round(discountedYearly / 12)}/mo billed annually`,
      };
    }
    return {
      amount: monthlyPrice,
      display: `₹${monthlyPrice.toLocaleString('en-IN')}`,
      period: '/ month',
      effectiveMonthly: null,
    };
  };

  const selectedPriceInfo = selectedPlan ? getPlanPrice(selectedPlan.monthlyPrice) : { amount: 999, display: '₹999', period: '/ month', effectiveMonthly: null };

  return (
    <div
      className="min-h-screen py-10 px-4 transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Onboarding for <strong className="text-indigo-600 dark:text-indigo-400">{user?.tenantName}</strong> · abhyasroom.in
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="rounded-lg p-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition cursor-pointer shadow-xs"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg cursor-pointer transition shadow-xs"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Logout Confirmation Modal */}
        <ConfirmModal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={() => {
            setShowLogoutConfirm(false);
            logout.mutate();
          }}
          title="Sign Out"
          description="Are you sure you want to sign out?"
          confirmLabel="Sign Out"
          cancelLabel="Cancel"
          variant="danger"
          isLoading={logout.isPending}
        />

        {/* ── Pending Verification Banner ── */}
        {isPendingApproval ? (
          <div className="max-w-xl mx-auto rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/10 p-8 shadow-2xl text-center space-y-4">
            <span className="text-5xl block animate-bounce">⏳</span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payment Verification in Progress</h2>
            <p className="text-xs text-amber-900 dark:text-amber-200/90 font-medium leading-relaxed">
              We have received your payment reference. Our platform administrator is verifying your UPI transfer.
              Your library dashboard will be activated immediately upon confirmation.
            </p>
            <div className="rounded-xl bg-white dark:bg-surface-900/80 p-4 border border-amber-200 dark:border-surface-700 inline-block text-left text-xs space-y-1.5 shadow-sm">
              <p><span className="text-slate-500 dark:text-slate-400">Library:</span> <strong className="text-slate-900 dark:text-white">{user?.tenantName}</strong></p>
              <p><span className="text-slate-500 dark:text-slate-400">Selected Plan:</span> <strong className="text-brand-600 dark:text-brand-400 capitalize">{user?.subscriptionTier} Tier</strong></p>
              <p><span className="text-slate-500 dark:text-slate-400">Status:</span> <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-semibold">Under Review</span></p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-surface-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-surface-600 px-4 py-2 text-xs font-semibold hover:bg-surface-700 transition"
              >
                ↻ Refresh Status
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Step Indicator */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-center text-xs font-semibold">
              <div
                className={`p-3 rounded-xl border transition-all ${
                  step === 2
                    ? 'border-[#1E3A8A] bg-[#EEF2FF] dark:border-blue-500 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>1. Library Desk Setup</span>
              </div>
              <div
                className={`p-3 rounded-xl border transition-all ${
                  step === 3
                    ? 'border-[#1E3A8A] bg-[#EEF2FF] dark:border-blue-500 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>2. Plan & Subscription</span>
              </div>
            </div>

            {/* ── STEP 2: Library Configuration ── */}
            {step === 2 && (
              <div className="max-w-xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Configure Your Library Space</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Tell us your initial seating capacity so we can set up your study hall.
                  </p>
                </div>

                <form onSubmit={handleSaveConfig} className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Approximate Seating Capacity (Total Study Desks) *
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="500"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-surface-600 bg-white dark:bg-surface-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500"
                      required
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      You can change seat numbering or add more desks anytime in the Seating Map.
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-surface-900/60 p-4 border border-slate-200 dark:border-surface-700 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="defaultShifts"
                      checked={defaultShifts}
                      onChange={(e) => setDefaultShifts(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 cursor-pointer"
                    />
                    <div>
                      <label htmlFor="defaultShifts" className="text-xs font-semibold text-slate-900 dark:text-white block cursor-pointer">
                        Auto-generate standard shifts & plans for me
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Pre-configures Morning Shift (07:00 AM – 03:00 PM), Evening Shift (03:00 PM – 11:00 PM), and Full-Day plans so you don't start from scratch.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={configureLibrary.isPending}
                    className="w-full rounded-xl bg-[#1E3A8A] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 py-3 text-sm font-bold !text-white shadow-md shadow-blue-950/20 disabled:opacity-50 cursor-pointer transition"
                  >
                    {configureLibrary.isPending ? 'Configuring Space…' : 'Next: Choose Subscription Plan →'}
                  </button>
                </form>
              </div>
            )}

            {/* ── STEP 3: SaaS Subscription Plan ── */}
            {step === 3 && (
              <div className="space-y-6">
                {/* ── Free Trial Eligibility Banner (Only for First-Time Users) ── */}
                {!user?.trialUsed && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/60 dark:via-teal-950/40 dark:to-indigo-950/50 border-2 border-emerald-300 dark:border-emerald-500/50 p-5 sm:p-6 shadow-xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-400/40 px-3 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Special Offer: Free Trial Pack Eligible</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                          Start with {plansData?.config?.trialDurationDays ?? 14} Days Completely Free!
                        </h3>
                        <p className="text-xs text-slate-700 dark:text-slate-300 max-w-xl leading-relaxed">
                          Try out AbhyasRoom without any upfront payment. Includes full access to visual seating maps,
                          desk allocation up to <strong className="text-slate-900 dark:text-white font-semibold">{plansData?.config?.trialMaxSeats ?? 50} desks</strong>, student registration,
                          ID cards, WhatsApp reminders, and payment receipts.
                        </p>
                      </div>

                      <div className="shrink-0 flex flex-col items-center sm:items-end gap-1.5">
                        <button
                          type="button"
                          disabled={startFreeTrial.isPending}
                          onClick={() => startFreeTrial.mutate()}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 !text-white px-6 py-3 text-sm font-extrabold shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                          <Zap className="h-4 w-4 fill-current" />
                          <span>{startFreeTrial.isPending ? 'Activating Trial…' : `Start ${plansData?.config?.trialDurationDays ?? 14}-Day Free Trial Now →`}</span>
                        </button>
                        <span className="text-[10px] text-emerald-800 dark:text-emerald-300/80 font-medium">No credit card or payment required</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center space-y-3 pt-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-px bg-slate-200 dark:border-slate-800 flex-1 max-w-xs" />
                    <span className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
                      {!user?.trialUsed ? 'Or Choose a Regular Plan' : 'Choose Your Plan'}
                    </span>
                    <div className="h-px bg-slate-200 dark:border-slate-800 flex-1 max-w-xs" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Choose Your Library Management Plan</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto font-medium">
                    Affordable pricing tailored for modern study libraries and learning hubs.
                  </p>

                  {/* Monthly vs Yearly Switch */}
                  <div className="flex items-center justify-center pt-2">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                          billingCycle === 'monthly'
                            ? 'bg-[#1E3A8A] dark:bg-blue-600 !text-white shadow'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Monthly Billing
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          billingCycle === 'yearly'
                            ? 'bg-[#1E3A8A] dark:bg-blue-600 !text-white shadow'
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {rawPlans.map((p) => {
                    const priceInfo = getPlanPrice(p.monthlyPrice);
                    const isSelected = selectedTier === p.code;

                    return (
                      <div
                        key={p._id}
                        onClick={() => setSelectedTier(p.code)}
                        className={`rounded-2xl border p-6 flex flex-col justify-between cursor-pointer transition relative ${
                          isSelected
                            ? 'border-[#1E3A8A] dark:border-blue-500 bg-white dark:bg-slate-900 shadow-xl shadow-blue-950/10 ring-2 ring-[#1E3A8A]/30 dark:ring-blue-500/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {p.isPopular && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#F59E0B] px-3.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-md whitespace-nowrap z-10">
                            Most Popular
                          </span>
                        )}

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-base font-bold text-slate-900 dark:text-white">{p.name}</h3>
                              {p.tagline && <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{p.tagline}</p>}
                            </div>
                            <input
                              type="radio"
                              name="plan"
                              checked={isSelected}
                              onChange={() => setSelectedTier(p.code)}
                              className="h-4 w-4 text-[#1E3A8A] dark:text-blue-500 cursor-pointer accent-[#1E3A8A]"
                            />
                          </div>

                          <div>
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{priceInfo.display}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium"> {priceInfo.period}</span>
                            {priceInfo.effectiveMonthly && (
                              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">{priceInfo.effectiveMonthly}</p>
                            )}
                            <p className="text-xs font-semibold text-[#1E3A8A] dark:text-blue-400 mt-1">Up to {p.maxDesks} Desks</p>
                          </div>

                          <ul className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4 text-xs text-slate-700 dark:text-slate-300">
                            {p.features.map((f, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                                <span className="font-medium leading-tight">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTier(p.code);
                            setShowPaymentModal(true);
                          }}
                          className={`mt-6 w-full rounded-xl py-2.5 text-xs font-bold shadow transition cursor-pointer ${
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

                <div className="text-center pt-4">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#172554] hover:to-[#1D4ED8] px-8 py-3.5 text-sm font-bold !text-white shadow-lg shadow-blue-950/25 transition cursor-pointer"
                  >
                    Proceed to Pay ({selectedPlan?.name || 'Selected Plan'}) →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── UPI QR & UTR Submission Modal ── */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-surface-700 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📱</span> UPI QR Code Payment
                </h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs cursor-pointer">
                  ✕
                </button>
              </div>

              <div className="text-center space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Scan with any UPI App (<span className="text-brand-600 dark:text-brand-400 font-semibold">PhonePe, GPay, Paytm, BHIM</span>)
                </p>

                {/* Dynamic UPI QR Code Image */}
                <div className="bg-white p-3 rounded-xl inline-block shadow-lg mx-auto border border-slate-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      `upi://pay?pa=${platformUpiId}&pn=${platformUpiName}&am=${selectedPriceInfo.amount}&cu=INR`
                    )}`}
                    alt="UPI QR Code"
                    className="h-44 w-44 object-contain"
                  />
                </div>

                <div className="text-center pt-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Amount ({billingCycle === 'yearly' ? 'Annual Plan' : 'Monthly Plan'})</p>
                  <p className="text-2xl font-black text-brand-600 dark:text-brand-400">
                    {selectedPriceInfo.display} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{selectedPriceInfo.period}</span>
                  </p>
                  <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-1">
                    UPI ID: <span className="text-slate-900 dark:text-white font-semibold">{platformUpiId}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Payee: {platformUpiName}</p>
                </div>
              </div>

              {/* UTR Submission Form */}
              <form onSubmit={handleSubmitUtr} className="space-y-3 pt-2 border-t border-slate-200 dark:border-surface-700">
                {utrError && (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-2 rounded border border-red-200 dark:border-red-500/20">{utrError}</p>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-white">
                    Enter 12-Digit UPI Reference / UTR Number *
                  </label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 412389102847"
                    maxLength={16}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-surface-600 bg-white dark:bg-surface-700 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Find this 12-digit number in your PhonePe / GPay payment receipt.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitPaymentUtr.isPending}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold !text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitPaymentUtr.isPending ? 'Submitting…' : 'Submit Reference & Activate Library →'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
