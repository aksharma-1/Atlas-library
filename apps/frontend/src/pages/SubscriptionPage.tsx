import { useAuth, usePublicSaasPlans } from '../hooks/useAuth';
import {
  CreditCard,
  Building,
  Armchair,
  Calendar,
  Sparkles,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';

export function SubscriptionPage() {
  const { user } = useAuth();
  const { data: plansData } = usePublicSaasPlans();

  const currentTier = user?.subscriptionTier || 'growth';
  const plans = plansData?.plans || [];
  const currentPlan = plans.find((p) => p.code === currentTier);

  const expiresAt = user?.subscriptionExpiresAt
    ? new Date(user.subscriptionExpiresAt)
    : null;

  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 3600 * 24)))
    : null;

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
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
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
                <p className="text-base font-extrabold text-indigo-400 capitalize mt-0.5">
                  {currentPlan?.name || currentTier} Tier
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
              <a href="/onboarding" className="inline-block w-full">
                <Button size="sm" variant="primary" className="w-full" icon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                  Change or Upgrade Plan
                </Button>
              </a>
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
    </div>
  );
}
