import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth, usePublicSaasPlans } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import {
  BookOpen,
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
} from 'lucide-react';

export function LandingPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: plansData } = usePublicSaasPlans();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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

  const plans = plansData?.plans || [
    {
      code: 'starter',
      name: 'Starter Space',
      monthlyPrice: 499,
      maxSeats: 40,
      description: 'Ideal for newly opened study halls & boutique reading rooms.',
      features: [
        'Up to 40 Desks tracking',
        'Morning & Evening shifts',
        'Student Admissions & Profiles',
        'Digital PDF/Thermal Receipts',
        'Basic WhatsApp Reminders',
      ],
    },
    {
      code: 'growth',
      name: 'Growth Hall',
      monthlyPrice: 999,
      maxSeats: 100,
      isPopular: true,
      description: 'The sweet spot for established competitive exam study libraries.',
      features: [
        'Up to 100 Desks tracking',
        'Multi-shift & 24/7 Full-day coverage',
        'Instant Desk Conflict Prevention',
        'WhatsApp Automated One-Click Alerts',
        'Overdue Fees & Partial Collection tracker',
        'Student ID Card Generator with QR verification',
      ],
    },
    {
      code: 'enterprise',
      name: 'Enterprise Hub',
      monthlyPrice: 1999,
      maxSeats: 300,
      description: 'Built for large commercial study chains and multi-floor centres.',
      features: [
        'Up to 300 Desks tracking',
        'Unlimited shifts & Custom time blocks',
        'Priority Staff Accounts & Role Controls',
        'Advanced Financial Analytics & Exports',
        'Dedicated VIP Onboarding & Support',
      ],
    },
  ];

  const yearlyDiscount = plansData?.config?.yearlyDiscountPercent ?? 20;

  const faqs = [
    {
      q: 'How does StudyOS prevent desk double-booking?',
      a: 'StudyOS has a built-in strict conflict engine. Whenever a student is assigned to a desk for a specific shift (e.g., Morning or Full Day), the system mathematically checks overlapping date boundaries and rejects double-bookings in real time with a 409 conflict safeguard.',
    },
    {
      q: 'Do I need expensive barcode scanners or hardware?',
      a: 'No special hardware is required. StudyOS works directly from any mobile phone, tablet, laptop, or desktop browser. Student ID cards generate with dynamic QR verification codes that can be scanned using any phone camera.',
    },
    {
      q: 'Can I collect partial fees or allow student installments?',
      a: 'Yes. StudyOS tracks exact payment amounts down to the rupee. If a plan is ₹1,000 and the student pays ₹600, the remaining ₹400 is automatically tagged as pending dues and highlighted in your Fees Due tab.',
    },
    {
      q: 'How do WhatsApp reminders work for overdue students?',
      a: 'With one tap, StudyOS generates a pre-formatted, polite fee reminder including student name, seat number, and outstanding amount, and opens WhatsApp immediately ready to send. No manual typing required.',
    },
    {
      q: 'Can I install this on my mobile phone like an app?',
      a: 'Yes! StudyOS is a full Progressive Web App (PWA). You can tap "Install" or "Add to Home Screen" on Android or iOS and run it full-screen without address bars.',
    },
  ];

  return (
    <div className="min-h-screen selection:bg-indigo-500 selection:text-white" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}>
      {/* ── TOP NAVIGATION BAR ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--header-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight" style={{ color: 'var(--text-main)' }}>
                Study<span className="text-indigo-500">OS</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Library Cloud Platform
              </span>
            </div>
          </Link>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <a href="#features" className="hover:text-indigo-400 transition">Features</a>
            <a href="#demo" className="hover:text-indigo-400 transition">Interactive Demo</a>
            <a href="#shifts" className="hover:text-indigo-400 transition">Shift Matrix</a>
            <a href="#pricing" className="hover:text-indigo-400 transition">Pricing Plans</a>
            <a href="#faq" className="hover:text-indigo-400 transition">FAQ</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2 rounded-xl border transition text-slate-400 hover:text-white cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </button>
            <Link
              to="/login"
              className="px-3.5 py-2 text-xs font-bold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        {/* Glow Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[250px] bg-purple-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Built Specifically for Indian Study Rooms & Reading Halls</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] max-w-4xl mx-auto" style={{ color: 'var(--text-main)' }}>
            The Modern Operating System for <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">Competitive Exam Libraries</span>
          </h1>

          <p className="mt-5 text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate double-booking conflicts, automate WhatsApp fee reminders, track shift occupancy in real time, and generate digital student ID cards without Excel headaches.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Start Managing Your Library</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border font-bold text-sm text-slate-300 hover:text-white transition flex items-center justify-center gap-2"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}
            >
              <span>Explore Live Seating Grid</span>
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-12 pt-8 border-t max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-400">100%</p>
              <p className="text-xs text-slate-400 mt-0.5">Conflict-Free Desks</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">1-Click</p>
              <p className="text-xs text-slate-400 mt-0.5">WhatsApp Reminders</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-amber-400">₹ Exact</p>
              <p className="text-xs text-slate-400 mt-0.5">Paise-Level Accounting</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-purple-400">PWA Ready</p>
              <p className="text-xs text-slate-400 mt-0.5">Runs on Phone & PC</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE DESK GRID PREVIEW (#demo) ── */}
      <section id="demo" className="py-16 relative border-y" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Real-time Visual Seating</span>
            <h2 className="text-2xl sm:text-3xl font-black mt-2" style={{ color: 'var(--text-main)' }}>
              See Who is Sitting Where in 1 Second
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Color-coded status indicators ensure your front desk staff never gives away an occupied desk.
            </p>
          </div>

          {/* Mock Interactive Desk Matrix Box */}
          <div className="rounded-3xl border glass-panel p-5 sm:p-8 shadow-2xl relative">
            {/* Header bar inside mock */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b mb-6" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono font-bold text-slate-400 ml-2">StudySpace Floor #1 (Active Shift: Morning 07:00 - 15:00)</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available (18)</span>
                <span className="flex items-center gap-1.5 text-indigo-400"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Occupied (30)</span>
                <span className="flex items-center gap-1.5 text-amber-400"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Maintenance (2)</span>
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
                    className={`rounded-xl p-2.5 text-center border transition-all cursor-default select-none ${
                      isOcc
                        ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300'
                        : isMaint
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:scale-105'
                    }`}
                  >
                    <p className="font-mono text-xs font-black">{desk.n}</p>
                    <p className="text-[10px] mt-1 truncate font-medium">
                      {isOcc ? desk.name : isMaint ? 'Repairs' : 'Ready'}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Full support for custom desk numbering (A-01, Desk 100, Cabin 3, Silent Wing).</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES GRID (#features) ── */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Tailored For Library Operations</span>
          <h2 className="text-3xl font-black mt-2" style={{ color: 'var(--text-main)' }}>
            Everything You Need to Run 1 to 10 Study Halls
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Built from real feedback of reading hall managers across Indore, Kota, Patna, Pune and Delhi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl border glass-card space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Grid className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Visual Desk Matrix</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time interactive floor view showing currently occupied desks, available chairs, and seats due for renewal.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl border glass-card space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Multi-Shift Timings</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Support Morning, Evening, Night and 24-Hour full-day shifts on the exact same desk with zero time collisions.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl border glass-card space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">1-Click WhatsApp Reminders</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Send personalized renewal notices and fee payment receipts directly to students on WhatsApp with one click.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl border glass-card space-y-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Installments & Outstanding Dues</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Keep precise track of students who paid half fee. Filter pending collections instantly to recover cash faster.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-2xl border glass-card space-y-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Branded Printable Receipts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate clean, tamper-evident payment slips with sequential receipt numbers (`REC-YYYY-XXXX`) and library branding.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-2xl border glass-card space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Student ID Cards with QR</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export and download student membership ID cards with scannable QR verification and photo badges ready to print.
            </p>
          </div>
        </div>
      </section>

      {/* ── SHIFT MATRIX SECTION (#shifts) ── */}
      <section id="shifts" className="py-16 border-y" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Double Your Revenue</span>
              <h2 className="text-3xl font-black mt-2 leading-tight" style={{ color: 'var(--text-main)' }}>
                Rent the Same Desk in 2 or 3 Shifts Without Confusion
              </h2>
              <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                Many students prepare for UPSC, NEET, or Banking exams at different hours. With StudyOS, Desk #12 can be occupied by a Morning student (07:00 – 15:00) and an Evening student (15:00 – 23:00) without ever conflicting.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Shift Overlap Prevention</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Strict database constraints ensure full-day admissions automatically lock both morning and evening slots.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Independent Pricing per Shift</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Configure distinct fee plans (e.g. ₹600 for Morning, ₹700 for Evening, ₹1,200 for Full Day).</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shift comparison card */}
            <div className="rounded-3xl border glass-panel p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sample Multi-Shift Desk Configuration</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Shift A • Morning Pass</span>
                    <p className="text-[11px] text-indigo-300 font-mono mt-0.5">07:00 AM – 03:00 PM</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">₹600 / mo</span>
                </div>

                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Shift B • Evening Pass</span>
                    <p className="text-[11px] text-purple-300 font-mono mt-0.5">03:00 PM – 11:00 PM</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">₹700 / mo</span>
                </div>

                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Shift C • Full-Day Dedicated Desk</span>
                    <p className="text-[11px] text-amber-300 font-mono mt-0.5">07:00 AM – 11:00 PM (16 Hrs)</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">₹1,200 / mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SAAS PRICING MATRIX (#pricing) ── */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Transparent SaaS Pricing</span>
          <h2 className="text-3xl font-black mt-2" style={{ color: 'var(--text-main)' }}>
            Simple Plans That Scale with Your Desk Capacity
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            No per-student fees or hidden charges. Pay flat pricing based on total desks.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-6 inline-flex items-center gap-3 p-1.5 rounded-2xl border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                billingCycle === 'monthly' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                billingCycle === 'yearly' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-extrabold border border-emerald-500/30">
                Save {yearlyDiscount}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((p: any) => {
            const isGrowth = p.isPopular || p.code === 'growth';
            const baseMonthly = p.monthlyPrice ?? 999;
            const price = billingCycle === 'yearly'
              ? Math.round(baseMonthly * (1 - yearlyDiscount / 100))
              : baseMonthly;

            return (
              <div
                key={p.code}
                className={`rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-200 ${
                  isGrowth
                    ? 'border-2 border-indigo-500/60 bg-gradient-to-b from-indigo-950/30 to-slate-900 shadow-2xl shadow-indigo-500/10 scale-105'
                    : 'border glass-card'
                }`}
                style={{ borderColor: isGrowth ? undefined : 'var(--border-subtle)' }}
              >
                {isGrowth && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                    Most Popular Choice
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-black text-white">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{p.description}</p>

                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-white">₹{price}</span>
                    <span className="text-xs text-slate-400 font-medium">/ month</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
                      Billed annually (Save {yearlyDiscount}%)
                    </p>
                  )}

                  <div className="mt-6 pt-6 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                      <Grid className="h-4 w-4 text-indigo-400" />
                      <span>Up to {p.maxSeats} Total Desks</span>
                    </div>

                    {p.features?.map((f: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <Link
                    to="/register"
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      isGrowth
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                        : 'border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white'
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
      <section id="faq" className="py-20 border-t" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Got Questions?</span>
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
                  className="rounded-2xl border glass-card overflow-hidden transition-colors"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-sm font-bold text-white">{faq.q}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-indigo-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-xs text-slate-400 leading-relaxed border-t border-slate-800/40 mt-1">
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
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="rounded-3xl p-10 sm:p-16 border bg-gradient-to-tr from-indigo-950/60 via-slate-900 to-purple-950/50 shadow-2xl relative overflow-hidden" style={{ borderColor: 'var(--border-glow)' }}>
            <div className="absolute top-0 right-0 h-48 w-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-3xl sm:text-4xl font-black text-white max-w-2xl mx-auto leading-tight">
              Ready to Upgrade Your Study Hall Experience?
            </h2>
            <p className="mt-4 text-sm text-slate-300 max-w-xl mx-auto">
              Join dozens of library owners who save 10+ hours every week and eliminate student seat disputes forever.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/40 transition cursor-pointer"
              >
                Create Your Library Account →
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-700 hover:border-slate-500 text-white font-bold text-sm transition"
              >
                Sign In to Existing Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t py-10" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--header-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-400" />
            <span className="font-bold text-slate-300">StudyOS</span>
            <span>• Built for Study Space Libraries & Reading Halls</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-slate-300 transition">Owner Login</Link>
            <Link to="/register" className="hover:text-slate-300 transition">Register Library</Link>
            <Link to="/admin" className="hover:text-slate-300 transition">Super Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
