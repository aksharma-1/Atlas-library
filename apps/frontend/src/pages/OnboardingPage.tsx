import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  useAuth,
  useConfigureLibrary,
  useSubmitPaymentUtr,
  useLogout,
  usePublicSaasPlans,
} from '../hooks/useAuth';

export function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const configureLibrary = useConfigureLibrary();
  const submitPaymentUtr = useSubmitPaymentUtr();
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
  const platformUpiId = plansData?.config?.upiId || import.meta.env.VITE_PLATFORM_UPI_ID || 'studyspace@upi';
  const platformUpiName = plansData?.config?.upiName || import.meta.env.VITE_PLATFORM_UPI_NAME || 'StudySpace OS';

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
    <div className="min-h-screen bg-surface-900 text-slate-100 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-700 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏛️</span>
            <div>
              <h1 className="text-xl font-black text-white">StudySpace OS</h1>
              <p className="text-xs text-slate-400">
                Setup & Subscription Onboarding for <strong className="text-brand-400">{user?.tenantName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => logout.mutate()}
            className="text-xs text-slate-400 hover:text-white border border-surface-700 px-3 py-1.5 rounded-lg"
          >
            Logout
          </button>
        </div>

        {/* ── Pending Verification Banner ── */}
        {isPendingApproval ? (
          <div className="max-w-xl mx-auto rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 shadow-2xl text-center space-y-4">
            <span className="text-5xl block animate-bounce">⏳</span>
            <h2 className="text-xl font-bold text-white">Payment Verification in Progress</h2>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              We have received your payment reference. Our platform administrator is verifying your UPI transfer.
              Your library dashboard will be activated immediately upon confirmation.
            </p>
            <div className="rounded-xl bg-surface-900/80 p-4 border border-surface-700 inline-block text-left text-xs space-y-1">
              <p><span className="text-slate-400">Library:</span> <strong className="text-white">{user?.tenantName}</strong></p>
              <p><span className="text-slate-400">Selected Plan:</span> <strong className="text-brand-400 capitalize">{user?.subscriptionTier} Tier</strong></p>
              <p><span className="text-slate-400">Status:</span> <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-semibold">Under Review</span></p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-surface-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-surface-600 transition"
              >
                ↻ Refresh Status
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Step Indicator */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-center text-xs font-semibold">
              <div className={`p-3 rounded-xl border ${step === 2 ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-surface-700 bg-surface-800 text-slate-400'}`}>
                <span>1. Library Desk Setup</span>
              </div>
              <div className={`p-3 rounded-xl border ${step === 3 ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-surface-700 bg-surface-800 text-slate-400'}`}>
                <span>2. Plan & Subscription</span>
              </div>
            </div>

            {/* ── STEP 2: Library Configuration ── */}
            {step === 2 && (
              <div className="max-w-xl mx-auto rounded-2xl border border-surface-700 bg-surface-800 p-8 shadow-xl space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Configure Your Library Space</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Tell us your initial seating capacity so we can set up your study hall.
                  </p>
                </div>

                <form onSubmit={handleSaveConfig} className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Approximate Seating Capacity (Total Study Desks) *
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="500"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-white focus:border-brand-500"
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      You can change seat numbering or add more desks anytime in the Seating Map.
                    </p>
                  </div>

                  <div className="rounded-xl bg-surface-900/60 p-4 border border-surface-700 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="defaultShifts"
                      checked={defaultShifts}
                      onChange={(e) => setDefaultShifts(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-surface-600 text-brand-600"
                    />
                    <div>
                      <label htmlFor="defaultShifts" className="text-xs font-semibold text-white block cursor-pointer">
                        Auto-generate standard shifts & plans for me
                      </label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pre-configures Morning Shift (07:00 AM – 03:00 PM), Evening Shift (03:00 PM – 11:00 PM), and Full-Day plans so you don't start from scratch.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={configureLibrary.isPending}
                    className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-500 disabled:opacity-50"
                  >
                    {configureLibrary.isPending ? 'Configuring Space…' : 'Next: Choose Subscription Plan →'}
                  </button>
                </form>
              </div>
            )}

            {/* ── STEP 3: SaaS Subscription Plan ── */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-black text-white">Choose Your Library Management Plan</h2>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto">
                    Affordable pricing tailored for modern study libraries and learning hubs.
                  </p>

                  {/* Monthly vs Yearly Switch */}
                  <div className="flex items-center justify-center pt-2">
                    <div className="bg-surface-800 p-1 rounded-xl border border-surface-700 flex items-center gap-1 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                          billingCycle === 'monthly'
                            ? 'bg-brand-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Monthly Billing
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          billingCycle === 'yearly'
                            ? 'bg-brand-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>Yearly Billing</span>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded border border-emerald-500/30">
                          SAVE {yearlyDiscount}%
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {rawPlans.map((p) => {
                    const priceInfo = getPlanPrice(p.monthlyPrice);
                    const isSelected = selectedTier === p.code;

                    return (
                      <div
                        key={p._id}
                        onClick={() => setSelectedTier(p.code)}
                        className={`rounded-2xl border p-6 flex flex-col justify-between cursor-pointer transition relative ${
                          isSelected
                            ? 'border-brand-500 bg-surface-800 shadow-xl shadow-brand-500/10'
                            : 'border-surface-700 bg-surface-800/60 hover:border-surface-600'
                        }`}
                      >
                        {p.isPopular && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                            Most Popular
                          </span>
                        )}

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-base font-bold text-white">{p.name}</h3>
                              {p.tagline && <p className="text-[11px] text-slate-400">{p.tagline}</p>}
                            </div>
                            <input
                              type="radio"
                              name="plan"
                              checked={isSelected}
                              onChange={() => setSelectedTier(p.code)}
                              className="h-4 w-4 text-brand-600"
                            />
                          </div>

                          <div>
                            <span className="text-3xl font-black text-white">{priceInfo.display}</span>
                            <span className="text-xs text-slate-400"> {priceInfo.period}</span>
                            {priceInfo.effectiveMonthly && (
                              <p className="text-[11px] text-emerald-400 font-semibold">{priceInfo.effectiveMonthly}</p>
                            )}
                            <p className="text-xs font-semibold text-brand-400 mt-1">Up to {p.maxDesks} Desks</p>
                          </div>

                          <ul className="space-y-2 border-t border-surface-700/60 pt-4 text-xs text-slate-300">
                            {p.features.map((f, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="text-emerald-400">✓</span>
                                <span>{f}</span>
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
                          className={`mt-6 w-full rounded-lg py-2.5 text-xs font-semibold shadow transition ${
                            isSelected
                              ? 'bg-brand-600 text-white hover:bg-brand-500'
                              : 'bg-surface-700 text-slate-200 hover:bg-surface-600'
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
                    className="rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg hover:from-brand-500 hover:to-indigo-500 transition"
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
            <div className="w-full max-w-md rounded-2xl border border-surface-700 bg-surface-800 p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-surface-700 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📱</span> UPI QR Code Payment
                </h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white text-xs">
                  ✕
                </button>
              </div>

              <div className="text-center space-y-2">
                <p className="text-xs text-slate-300">
                  Scan with any UPI App (<span className="text-brand-400 font-semibold">PhonePe, GPay, Paytm, BHIM</span>)
                </p>

                {/* Dynamic UPI QR Code Image */}
                <div className="bg-white p-3 rounded-xl inline-block shadow-lg mx-auto">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      `upi://pay?pa=${platformUpiId}&pn=${platformUpiName}&am=${selectedPriceInfo.amount}&cu=INR`
                    )}`}
                    alt="UPI QR Code"
                    className="h-44 w-44 object-contain"
                  />
                </div>

                <div className="text-center pt-1">
                  <p className="text-xs text-slate-400">Total Amount ({billingCycle === 'yearly' ? 'Annual Plan' : 'Monthly Plan'})</p>
                  <p className="text-2xl font-black text-brand-400">
                    {selectedPriceInfo.display} <span className="text-xs font-normal text-slate-400">{selectedPriceInfo.period}</span>
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 mt-1">
                    UPI ID: <span className="text-white font-semibold">{platformUpiId}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">Payee: {platformUpiName}</p>
                </div>
              </div>

              {/* UTR Submission Form */}
              <form onSubmit={handleSubmitUtr} className="space-y-3 pt-2 border-t border-surface-700">
                {utrError && (
                  <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded">{utrError}</p>
                )}
                <div>
                  <label className="block text-xs font-semibold text-white">
                    Enter 12-Digit UPI Reference / UTR Number *
                  </label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 412389102847"
                    maxLength={16}
                    className="mt-1 w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm font-mono text-white placeholder-slate-500 focus:border-brand-500"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Find this 12-digit number in your PhonePe / GPay payment receipt.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitPaymentUtr.isPending}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2"
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
