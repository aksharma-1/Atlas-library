import React, { useState, useEffect } from 'react';
import { useUserProfile, useUpdateProfile } from '../hooks/useAuth';
import {
  User,
  Building2,
  Lock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export function ProfilePage() {
  const { data: profile, isLoading } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();

  // Tab state
  const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [libraryName, setLibraryName] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sync profile data when loaded
  useEffect(() => {
    if (profile?.user) {
      setName(profile.user.name || '');
    }
    if (profile?.tenant) {
      setLibraryName(profile.tenant.name || '');
      setPhone(profile.tenant.phone || '');
      setCity(profile.tenant.city || '');
      setAddress(profile.tenant.address || '');
    }
  }, [profile]);

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name,
      phone,
      city,
      address,
      libraryName: profile?.user.role === 'owner' ? libraryName : undefined,
    });
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    updateProfileMutation.mutate(
      {
        currentPassword,
        newPassword,
      },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading user profile...</p>
        </div>
      </div>
    );
  }

  const isOwner = profile?.user?.role === 'owner';
  const isSuperAdmin = profile?.user?.role === 'superadmin';

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Top Banner / Hero Card */}
      <div
        className="rounded-2xl p-6 md:p-8 border shadow-sm relative overflow-hidden transition-all duration-200"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl md:text-3xl font-extrabold shadow-lg shadow-indigo-500/20">
              {profile?.user.name ? profile.user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>
                  {profile?.user.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {profile?.user.role}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 font-medium">
                <Mail className="h-3.5 w-3.5" />
                {profile?.user.email}
              </p>
              {profile?.tenant && (
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {profile.tenant.name}
                  </span>
                  <span>•</span>
                  <span>Tier: <strong className="capitalize">{profile.tenant.subscriptionTier || 'Starter'}</strong></span>
                  <span>•</span>
                  <span>Max Seats: <strong>{profile.tenant.maxSeats}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Platform Badge */}
          <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800 gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified Account</span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Member since {profile?.user.createdAt ? new Date(profile.user.createdAt).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'details'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile & Library Info</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Security & Password</span>
        </button>
      </div>

      {/* Tab 1: Profile & Library Info */}
      {activeTab === 'details' && (
        <form onSubmit={handleSaveDetails} className="space-y-6">
          {/* Section: Personal Info */}
          <div
            className="rounded-2xl p-6 border shadow-sm transition-all"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <User className="h-4 w-4 text-indigo-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-main)' }}>
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address <span className="text-[10px] text-slate-400 font-normal">(Account Login Email)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={profile?.user.email || ''}
                    className="w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  />
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 absolute right-3 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Library Information (Tenant) */}
          {!isSuperAdmin && profile?.tenant && (
            <div
              className="rounded-2xl p-6 border shadow-sm transition-all"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-main)' }}>
                    Library / Organization Details
                  </h2>
                </div>
                {!isOwner && (
                  <span className="text-[11px] text-amber-500 font-medium">
                    (Only library owners can modify library business identity)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Library / Study Space Name
                  </label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    value={libraryName}
                    onChange={(e) => setLibraryName(e.target.value)}
                    placeholder="e.g. Paramount Study Space"
                    className="w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    style={{
                      backgroundColor: 'var(--bg-main)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-main)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Phone / WhatsApp
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full rounded-xl border pl-9 pr-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      style={{
                        backgroundColor: 'var(--bg-main)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-main)',
                      }}
                    />
                    <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    City / Town
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Indore, MP"
                      className="w-full rounded-xl border pl-9 pr-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      style={{
                        backgroundColor: 'var(--bg-main)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-main)',
                      }}
                    />
                    <MapPin className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 2nd Floor, Apex Plaza, Bhanwarkua"
                    className="w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    style={{
                      backgroundColor: 'var(--bg-main)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-main)',
                    }}
                  />
                </div>
              </div>

              {/* Plan summary badge in card */}
              <div className="mt-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Subscription Tier: <strong className="text-indigo-600 dark:text-indigo-400 capitalize">{profile.tenant.subscriptionTier || 'Starter'}</strong>
                  </p>
                </div>
                <a
                  href="/subscription"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Manage Subscription →
                </a>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Profile Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <form onSubmit={handleSavePassword} className="space-y-6">
          <div
            className="rounded-2xl p-6 border shadow-sm transition-all"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <Lock className="h-4 w-4 text-indigo-500" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-main)' }}>
                  Change Password
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update your account password to ensure your study space management remains secure.
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {passwordError}
              </div>
            )}

            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
