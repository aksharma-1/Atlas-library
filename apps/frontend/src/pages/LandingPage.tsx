import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth, usePublicSaasPlans } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Logo } from '../components/ui';
import {
  Moon,
  Sun,
  ArrowRight,
  ShieldCheck,
  Zap,
  Grid,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CreditCard,
  MessageSquare,
  Receipt,
  Clock,
  Check,
  Gift,
  Printer,
  Smartphone,
} from 'lucide-react';

export function LandingPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: plansData } = usePublicSaasPlans();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<'morning' | 'evening' | 'fullday'>('morning');

  // If already authenticated and ready, redirect to dashboard or onboarding
  if (!isLoading && isAuthenticated) {
    if (user?.role === 'superadmin') {
      return <Navigate to="/admin" replace />;
    }
    if (user?.subscriptionStatus === 'pending_payment') {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const DEFAULT_PLAN_CONFIG: Record<string, { maxDesks: number; description: string; features: string[] }> = {
    starter: {
      maxDesks: 50,
      description: 'Ideal for newly opened study halls & boutique reading rooms.',
      features: [
        'Up to 50 Desks tracking',
        'Morning & Evening shifts',
        'Student Admissions & Profiles',
        'Thermal Printer & PDF Receipts',
        '1-Click WhatsApp Reminders',
      ],
    },
    growth: {
      maxDesks: 150,
      description: 'The sweet spot for established competitive exam study libraries.',
      features: [
        'Up to 150 Desks tracking',
        'Multi-shift & 24/7 Full-day coverage',
        'Instant Desk Conflict Prevention',
        'WhatsApp Automated One-Click Alerts',
        'Overdue Fees & Partial Collection tracker',
        'Student ID Card Generator with QR verification',
        'Thermal Receipt Printer integration (58mm/80mm)',
      ],
    },
    pro: {
      maxDesks: 250,
      description: 'Built for high-volume commercial study centers & reading halls.',
      features: [
        'Up to 250 Desks tracking',
        'Multi-shift & 24/7 Full-day coverage',
        'Instant Desk Conflict Prevention',
        'WhatsApp Automated One-Click Alerts',
        'Overdue Fees & Partial Collection tracker',
        'Student ID Card Generator with QR verification',
        'Gift Days & Membership Extension credits',
      ],
    },
    enterprise: {
      maxDesks: 500,
      description: 'Built for large commercial study chains and multi-floor centres.',
      features: [
        'Up to 500 Desks tracking',
        'Unlimited shifts & Custom time blocks',
        'Priority Staff Accounts & Role Controls',
        'Advanced Financial Analytics & Exports',
        'Dedicated VIP Onboarding & Support',
      ],
    },
  };

  const plans = plansData?.plans || [
    {
      code: 'starter',
      name: 'Starter Space',
      monthlyPrice: 499,
      maxDesks: 50,
      description: DEFAULT_PLAN_CONFIG.starter.description,
      features: DEFAULT_PLAN_CONFIG.starter.features,
    },
    {
      code: 'growth',
      name: 'Growth Hall',
      monthlyPrice: 999,
      maxDesks: 150,
      isPopular: true,
      description: DEFAULT_PLAN_CONFIG.growth.description,
      features: DEFAULT_PLAN_CONFIG.growth.features,
    },
    {
      code: 'enterprise',
      name: 'Enterprise Hub',
      monthlyPrice: 1999,
      maxDesks: 500,
      description: DEFAULT_PLAN_CONFIG.enterprise.description,
      features: DEFAULT_PLAN_CONFIG.enterprise.features,
    },
  ];

  const yearlyDiscount = plansData?.config?.yearlyDiscountPercent ?? 20;

  const faqs = [
    {
      q: 'Is there a free trial before I commit to a paid plan?',
      a: 'Yes! Every new library registration on abhyasroom.in comes with a 14-Day Free Trial for up to 50 study desks. You get full, unrestricted access to the visual seating map, multi-shift scheduling, student admissions, QR verification ID cards, thermal receipts, and automated WhatsApp reminders. No credit card or advance payment is required.',
    },
    {
      q: 'How does AbhyasRoom prevent desk double-booking?',
      a: 'AbhyasRoom uses a mathematical interval conflict engine. Whenever a student is allocated to a desk for a shift (e.g. Morning or Full Day), the system verifies overlapping calendar date boundaries in real-time, blocking double-bookings with a strict conflict check.',
    },
    {
      q: 'Do I need expensive barcode scanners or hardware?',
      a: 'No special hardware is required. AbhyasRoom runs smoothly on any smartphone, tablet, laptop, or desktop. Student ID cards generate with dynamic QR verification codes that can be scanned using standard smartphone cameras. If you have a 58mm or 80mm thermal receipt printer, AbhyasRoom connects directly via browser print.',
    },
    {
      q: 'Can I collect partial fees or allow student installments?',
      a: 'Yes. AbhyasRoom tracks exact payment amounts down to the rupee and paisa. If a plan is ₹1,000 and the student pays ₹600, the remaining ₹400 is automatically tracked under outstanding dues and highlighted in your fee collections ledger.',
    },
    {
      q: 'How do WhatsApp reminders work for overdue students?',
      a: 'With one tap, AbhyasRoom creates a pre-formatted, courteous fee reminder including the student’s name, desk number, due date, and outstanding balance, then opens WhatsApp directly. No manual typing or copy-pasting needed.',
    },
    {
      q: 'Can I install this on my mobile phone like an app?',
      a: 'Yes! AbhyasRoom is a full Progressive Web App (PWA) available on abhyasroom.in. You can tap "Install" or "Add to Home Screen" on Android, iOS, Windows, or Mac and run it full-screen without browser address bars.',
    },
  ];

  const isLight = theme === 'light';

  return (
    <div
      className="min-h-screen selection:bg-indigo-500 selection:text-white transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)',
      }}
    >
      {/* ── TOP STICKY NAVBAR ── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-200"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.85)',
          boxShadow: isLight ? '0 1px 10px rgba(0,0,0,0.03)' : '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <Link to="/" className="flex items-center group">
            <Logo size="md" showDomain={true} />
          </Link>

          {/* Smooth Scroll Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Seating Map Demo
            </a>
            <a href="#shifts" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Shift Matrix
            </a>
            <a href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Pricing Plans
            </a>
            <a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2 rounded-xl border transition-all text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white cursor-pointer hover:scale-105"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </button>
            <Link
              to="/login"
              className="px-3.5 py-2 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#1E3A8A] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 !text-white shadow-md shadow-blue-950/20 transition-all duration-200 flex items-center gap-1.5 hover:translate-y-[-1px]"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        {/* Glow Ambient Blobs with smooth pulse animation */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/15 dark:bg-indigo-500/20 rounded-full blur-[130px] pointer-events-none animate-glow" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[250px] bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 via-indigo-50 to-purple-50 dark:from-emerald-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-emerald-300 dark:border-emerald-500/30 text-xs font-bold mb-6 shadow-xs">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Special Offer: 14-Day Free Trial Eligible</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
            <span className="text-indigo-700 dark:text-indigo-300 font-semibold">
              Up to 50 Desks • No Credit Card Required
            </span>
          </div>

          <h1
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] max-w-4xl mx-auto"
            style={{ color: 'var(--text-main)' }}
          >
            The Operating System for{' '}
            <span
              className="inline-block bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 bg-clip-text text-transparent"
              style={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Competitive Exam Libraries
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
            Eliminate double-booking disputes, automate WhatsApp fee reminders, track shift occupancy in real time, and issue QR-verified student ID cards with zero Excel headaches.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 !text-white font-extrabold text-sm shadow-xl shadow-blue-950/25 hover:scale-[1.02] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <span>Explore Live Seating Grid ↓</span>
            </a>
          </div>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
            ⚡ Instant activation · Up to 50 desks · Zero upfront payment · Setup in 2 minutes
          </p>

          {/* Key Metric Badges */}
          <div
            className="mt-14 pt-8 border-t max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="p-3 rounded-2xl transition hover:bg-slate-50 dark:hover:bg-slate-900/40">
              <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">100%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Conflict-Free Desks</p>
            </div>
            <div className="p-3 rounded-2xl transition hover:bg-slate-50 dark:hover:bg-slate-900/40">
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">1-Click</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">WhatsApp Reminders</p>
            </div>
            <div className="p-3 rounded-2xl transition hover:bg-slate-50 dark:hover:bg-slate-900/40">
              <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">₹ Exact</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Paise Accounting</p>
            </div>
            <div className="p-3 rounded-2xl transition hover:bg-slate-50 dark:hover:bg-slate-900/40">
              <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">PWA Ready</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Install on Phone & PC</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE DESK GRID PREVIEW (#demo) ── */}
      <section
        id="demo"
        className="py-20 relative border-y transition-colors duration-200"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--bg-card-subtle)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Real-Time Visual Seating
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-2" style={{ color: 'var(--text-main)' }}>
              See Who is Sitting Where in 1 Second
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
              Color-coded status indicators ensure your front desk staff never gives away an occupied desk. Filter by active shift below to see live occupancy updates.
            </p>

            {/* Shift Filter Pills for Demo */}
            <div className="mt-5 inline-flex items-center gap-1.5 p-1 rounded-xl border bg-white dark:bg-slate-900 shadow-xs" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={() => setSelectedShiftFilter('morning')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedShiftFilter === 'morning'
                    ? 'bg-indigo-600 !text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Morning Shift (07:00 - 15:00)
              </button>
              <button
                onClick={() => setSelectedShiftFilter('evening')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedShiftFilter === 'evening'
                    ? 'bg-indigo-600 !text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Evening Shift (15:00 - 23:00)
              </button>
              <button
                onClick={() => setSelectedShiftFilter('fullday')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedShiftFilter === 'fullday'
                    ? 'bg-indigo-600 !text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Full Day 24/7 Pass
              </button>
            </div>
          </div>

          {/* Mock Interactive Desk Matrix Box */}
          <div
            className="rounded-3xl border p-5 sm:p-8 shadow-2xl relative transition-all duration-300"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {/* Header bar inside mock */}
            <div
              className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b mb-6"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 ml-2">
                  Library Floor Wing A • Live View
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available (18)
                </span>
                <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Occupied (30)
                </span>
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Maintenance (2)
                </span>
              </div>
            </div>

            {/* Desk matrix samples */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2.5">
              {[
                { n: 'A-1', st: 'occupied', name: 'Rohan S.' },
                { n: 'A-2', st: 'occupied', name: 'Priya V.' },
                { n: 'A-3', st: 'available' },
                { n: 'A-4', st: 'occupied', name: 'Amit K.' },
                { n: 'A-5', st: 'available' },
                { n: 'A-6', st: 'occupied', name: 'Sneha R.' },
                { n: 'A-7', st: 'maintenance' },
                { n: 'A-8', st: 'available' },
                { n: 'A-9', st: 'occupied', name: 'Vikas T.' },
                { n: 'A-10', st: 'occupied', name: 'Deepa M.' },
                { n: 'B-1', st: 'occupied', name: 'Rahul G.' },
                { n: 'B-2', st: 'available' },
                { n: 'B-3', st: 'occupied', name: 'Pooja S.' },
                { n: 'B-4', st: 'occupied', name: 'Manoj N.' },
                { n: 'B-5', st: 'available' },
                { n: 'B-6', st: 'available' },
                { n: 'B-7', st: 'occupied', name: 'Anjali P.' },
                { n: 'B-8', st: 'occupied', name: 'Sunil D.' },
                { n: 'B-9', st: 'available' },
                { n: 'B-10', st: 'available' },
              ].map((desk, idx) => {
                const isOcc = desk.st === 'occupied';
                const isMaint = desk.st === 'maintenance';
                return (
                  <div
                    key={idx}
                    className={`rounded-xl p-2.5 text-center border transition-all duration-200 cursor-default select-none hover:scale-105 ${
                      isOcc
                        ? 'bg-indigo-100/90 border-indigo-300 dark:bg-indigo-950/60 dark:border-indigo-500/40'
                        : isMaint
                        ? 'bg-amber-100/90 border-amber-300 dark:bg-amber-950/60 dark:border-amber-500/40'
                        : 'bg-emerald-100/90 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-500/30'
                    }`}
                  >
                    <p
                      className={`font-mono text-xs font-black ${
                        isOcc
                          ? 'text-indigo-950 dark:text-indigo-200'
                          : isMaint
                          ? 'text-amber-950 dark:text-amber-200'
                          : 'text-emerald-950 dark:text-emerald-200'
                      }`}
                    >
                      {desk.n}
                    </p>
                    <p
                      className={`text-[10px] mt-1 truncate font-bold ${
                        isOcc
                          ? 'text-indigo-800 dark:text-indigo-300'
                          : isMaint
                          ? 'text-amber-800 dark:text-amber-300'
                          : 'text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {isOcc ? desk.name : isMaint ? 'Repairs' : 'Ready'}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Full natural alphanumeric desk sorting supported (Desk 1, Desk 2, ..., Desk 100).</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES GRID (#features) ── */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Tailored For Library Operations
          </span>
          <h2 className="text-3xl sm:text-4xl font-black mt-2" style={{ color: 'var(--text-main)' }}>
            Everything You Need to Run 1 to 10 Study Halls
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Engineered from hands-on study hall workflows across tier-1 and tier-2 Indian cities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div
            className="p-6 rounded-2xl border transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg space-y-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Grid className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>Visual Desk Matrix</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Real-time interactive floor view showing currently occupied desks, available chairs, and seats due for renewal.
            </p>
          </div>

          {/* Feature 2 */}
          <div
            className="p-6 rounded-2xl border transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg space-y-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>Multi-Shift Timings</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Support Morning, Evening, Night and 24-Hour full-day shifts on the exact same desk with zero time collisions.
            </p>
          </div>

          {/* Feature 3 */}
          <div
            className="p-6 rounded-2xl border transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg space-y-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>1-Click WhatsApp Reminders</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Send personalized renewal notices and fee payment receipts directly to students on WhatsApp with one click.
            </p>
          </div>

          {/* Feature 4 */}
          <div
            className="p-6 rounded-2xl border transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg space-y-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>Installments & Outstanding Dues</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Keep precise track of students who paid half fee. Filter pending collections instantly to recover cash faster.
            </p>
          </div>

          {/* Feature 5 */}
          <div
            className="p-6 rounded-2xl border transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg space-y-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>Branded Printable Receipts</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Generate clean, tamper-evident payment slips with sequential receipt numbers (`REC-YYYY-XXXX`) and library branding.
            </p>
          </div>

          {/* Feature 6 */}
          <div
            className="p-6 rounded-2xl border transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg space-y-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>Student ID Cards with QR</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Export and download student membership ID cards with scannable QR verification and photo badges ready to print.
            </p>
          </div>

          {/* Feature 7 */}
          <div
            className="p-6 rounded-2xl border transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg space-y-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Printer className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>Thermal Receipt Printing</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Built-in support for 58mm & 80mm thermal receipt printers. Print instant cash and UPI slips directly from any device.
            </p>
          </div>

          {/* Feature 8 */}
          <div
            className="p-6 rounded-2xl border transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg space-y-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="h-10 w-10 rounded-xl bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <Gift className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>Gift Days & Leave Credits</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Award festive bonus days, credit exam extension periods, and manage student departures with automatic desk re-allocation.
            </p>
          </div>

          {/* Feature 9 */}
          <div
            className="p-6 rounded-2xl border transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg space-y-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="h-10 w-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Smartphone className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>Installable Mobile & PC PWA</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Install AbhyasRoom directly to your home screen or desktop via Chrome or Safari. Runs offline with high-speed caching.
            </p>
          </div>
        </div>
      </section>

      {/* ── SHIFT MATRIX SECTION (#shifts) ── */}
      <section
        id="shifts"
        className="py-20 border-y transition-colors duration-200"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--bg-card-subtle)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                Double Your Desk Yield
              </span>
              <h2 className="text-3xl font-black mt-2 leading-tight" style={{ color: 'var(--text-main)' }}>
                Rent the Same Desk Across 2 or 3 Shifts Without Confusion
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed font-normal">
                Different students study at different times. With AbhyasRoom, Desk #12 can be occupied by a Morning student (07:00 – 15:00) and an Evening student (15:00 – 23:00) without ever colliding.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shrink-0 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>Shift Overlap Prevention</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Full-day admissions automatically reserve both morning and evening slots, preventing accidental double booking.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shrink-0 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>Independent Pricing Per Shift</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Configure distinct fee plans (e.g. ₹600 for Morning, ₹700 for Evening, ₹1,200 for Full Day).</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shift comparison preview card */}
            <div
              className="rounded-3xl border p-6 sm:p-8 space-y-4 shadow-xl transition-all"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Sample Multi-Shift Desk Configuration
              </h3>
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-500/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Shift A • Morning Pass</span>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-mono mt-0.5">07:00 AM – 03:00 PM</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                    ₹600 / mo
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-50/60 dark:bg-purple-500/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Shift B • Evening Pass</span>
                    <p className="text-[11px] text-purple-700 dark:text-purple-300 font-mono mt-0.5">03:00 PM – 11:00 PM</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                    ₹700 / mo
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Shift C • Full-Day Dedicated Desk</span>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 font-mono mt-0.5">07:00 AM – 11:00 PM (16 Hrs)</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                    ₹1,200 / mo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SAAS PRICING MATRIX (#pricing) ── */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 14-Day Free Trial Spotlight Banner */}
        <div className="mb-14 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-indigo-950/40 border-2 border-emerald-300 dark:border-emerald-500/40 p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-400/40 px-3.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Special Offer: Free Trial Pack Eligible</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Start with 14 Days Completely Free!
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
              Experience the entire AbhyasRoom platform with zero upfront payment. Includes real-time seating maps, multi-shift slot timers, student registration, QR ID cards, thermal receipt printing, and WhatsApp alerts for up to 50 desks.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span>✓ No credit card required</span>
              <span>•</span>
              <span>✓ Up to 50 desks capacity</span>
              <span>•</span>
              <span>✓ Instant 2-minute activation</span>
            </div>
          </div>
          <Link
            to="/register"
            className="shrink-0 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 !text-white text-xs font-extrabold shadow-xl shadow-emerald-600/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Zap className="h-4 w-4 fill-current" />
            <span>Claim 14-Day Free Trial →</span>
          </Link>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Transparent SaaS Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-black mt-2" style={{ color: 'var(--text-main)' }}>
            Simple Plans That Scale with Your Desk Capacity
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            No per-student fees or hidden charges. Flat pricing based on total desks.
          </p>

          {/* Billing Cycle Toggle */}
          <div
            className="mt-6 inline-flex items-center gap-3 p-1.5 rounded-2xl border shadow-xs"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-[#1E3A8A] dark:bg-blue-600 !text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-[#1E3A8A] dark:bg-blue-600 !text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-black border border-amber-500/30">
                Save {yearlyDiscount}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-6">
          {plans.map((p: any) => {
            const planKey = (p.code || 'growth').toLowerCase();
            const defaults = DEFAULT_PLAN_CONFIG[planKey] || DEFAULT_PLAN_CONFIG.growth;

            const isGrowth = p.isPopular || planKey === 'growth' || planKey === 'pro';
            const baseMonthly = p.monthlyPrice ?? 999;
            const price =
              billingCycle === 'yearly'
                ? Math.round(baseMonthly * (1 - yearlyDiscount / 100))
                : baseMonthly;

            const planFeatures = (Array.isArray(p.features) && p.features.length > 0)
              ? p.features
              : defaults.features;
            const planDesks = p.maxDesks ?? p.maxSeats ?? defaults.maxDesks;
            const planDesc = p.description || p.tagline || defaults.description;

            return (
              <div
                key={p.code}
                className={`rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-300 hover:translate-y-[-2px] overflow-visible ${
                  isGrowth
                    ? 'border-2 border-indigo-600 dark:border-indigo-400/80 shadow-2xl shadow-indigo-500/15 dark:shadow-[0_0_45px_-5px_rgba(99,102,241,0.35)] md:scale-105 z-10'
                    : 'border shadow-md'
                }`}
                style={{
                  backgroundColor: isGrowth
                    ? (isLight ? '#ffffff' : '#11182d')
                    : 'var(--bg-card)',
                  backgroundImage: isGrowth && !isLight
                    ? 'linear-gradient(180deg, rgba(79, 70, 229, 0.28) 0%, rgba(26, 35, 66, 0.95) 45%, rgba(13, 19, 36, 0.98) 100%)'
                    : undefined,
                  borderColor: isGrowth
                    ? (isLight ? '#4f46e5' : '#818cf8')
                    : 'var(--border-subtle)',
                }}
              >
                {/* Luminous Top Glow Flare in Dark Mode */}
                {isGrowth && !isLight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-indigo-500/30 blur-2xl rounded-full pointer-events-none" />
                )}

                {isGrowth && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#F59E0B] text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-md shadow-amber-500/30 border border-amber-300 whitespace-nowrap z-20 flex items-center gap-1.5 pointer-events-none">
                    <Sparkles className="h-3 w-3 text-slate-950 fill-slate-950 shrink-0" />
                    <span>Most Popular Choice</span>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{p.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 min-h-[36px] font-normal leading-relaxed">{planDesc}</p>

                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">₹{price}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ month</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                      Billed annually (Save {yearlyDiscount}%)
                    </p>
                  )}

                  <div className="mt-6 pt-6 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      <Grid className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="text-indigo-950 dark:text-indigo-200">Up to {planDesks} Total Desks</span>
                    </div>

                    {planFeatures.map((f: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs">
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <Link
                    to="/register"
                    className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      isGrowth
                        ? 'bg-[#1E3A8A] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 !text-white shadow-lg shadow-blue-950/25 hover:scale-[1.01]'
                        : 'border border-slate-300 dark:border-slate-700 hover:border-[#1E3A8A] text-slate-700 dark:text-slate-200 hover:text-[#1E3A8A] dark:hover:text-white hover:bg-[#EEF2FF] dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FREQUENTLY ASKED QUESTIONS (#faq) ── */}
      <section
        id="faq"
        className="py-20 border-t transition-colors duration-200"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--bg-card-subtle)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Got Questions?
            </span>
            <h2 className="text-3xl font-black mt-2" style={{ color: 'var(--text-main)' }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border overflow-hidden transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:opacity-90"
                  >
                    <span className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div
                      className="px-5 pb-5 pt-0 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t mt-1"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FINAL CALL TO ACTION ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div
            className="rounded-3xl p-10 sm:p-16 border bg-gradient-to-tr from-indigo-900 via-slate-900 to-purple-950 text-white shadow-2xl relative overflow-hidden"
            style={{ borderColor: 'var(--border-glow)' }}
          >
            <div className="absolute top-0 right-0 h-48 w-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-3xl sm:text-4xl font-black max-w-2xl mx-auto leading-tight !text-white text-white">
              Ready to Upgrade Your Study Hall Experience?
            </h2>
            <p className="mt-4 text-sm text-indigo-100 max-w-xl mx-auto">
              Join dozens of library owners across India who save 10+ hours every week and eliminate student seat disputes forever. Start your 14-day free trial today.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 !text-white font-extrabold text-sm shadow-xl shadow-blue-950/30 hover:scale-[1.02] transition-all cursor-pointer"
              >
                Start 14-Day Free Trial →
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-indigo-300/30 hover:border-white font-bold text-sm !text-white bg-white/10 hover:bg-white/20 transition"
              >
                Sign In to Existing Account
              </Link>
            </div>
            <p className="mt-4 text-xs text-indigo-200/80">
              No credit card or payment required • Up to 50 desks free on abhyasroom.in
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="border-t py-12 transition-colors duration-200"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.95)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Logo size="xs" />
            <span>• abhyasroom.in — Built for Modern Study Libraries & Reading Rooms</span>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <Link to="/login" className="hover:text-indigo-600 dark:hover:text-slate-300 transition">
              Owner Login
            </Link>
            <Link to="/register" className="hover:text-indigo-600 dark:hover:text-slate-300 transition">
              Register Library
            </Link>
            <Link to="/admin" className="hover:text-indigo-600 dark:hover:text-slate-300 transition">
              Super Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
