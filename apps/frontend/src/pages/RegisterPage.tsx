import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate } from 'react-router-dom';
import { useRegister, useAuth } from '../hooks/useAuth';

const registerSchema = z.object({
  name: z.string().min(2, 'Your full name is required').trim(),
  libraryName: z.string().min(2, 'Library / Study space name is required').trim(),
  email: z.string().email('Enter a valid email address').trim().toLowerCase(),
  phone: z.string().min(10, 'Enter a valid 10-digit mobile number').trim(),
  city: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const registerMutation = useRegister();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  if (!isLoading && isAuthenticated) {
    if (user?.subscriptionStatus === 'pending_payment') {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = (data: RegisterForm) => {
    setErrorMessage(null);
    registerMutation.mutate(data, {
      onError: (err: any) => {
        setErrorMessage(err.response?.data?.error || 'Registration failed. Please try again.');
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-900 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="mb-6 text-center">
          <span className="text-5xl">🏛️</span>
          <h1 className="mt-3 text-2xl font-black tracking-wide text-white">StudySpace OS</h1>
          <p className="mt-1 text-xs text-slate-400">
            Register your library or study space and start managing students & desks in minutes.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-surface-700 bg-surface-800 p-8 shadow-2xl space-y-6">
          <div className="border-b border-surface-700 pb-3">
            <h2 className="text-base font-bold text-white">Create Library Account</h2>
            <p className="text-xs text-slate-400">Step 1 of 3: Account & Library Details</p>
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300">Library / Space Name *</label>
              <input
                type="text"
                {...register('libraryName')}
                placeholder="e.g. Apex Study Library"
                className="mt-1 w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-brand-500"
              />
              {errors.libraryName && (
                <p className="mt-1 text-xs text-red-400">{errors.libraryName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300">Owner Full Name *</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Rahul Sharma"
                  className="mt-1 w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-brand-500"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300">City / Location</label>
                <input
                  type="text"
                  {...register('city')}
                  placeholder="e.g. Indore"
                  className="mt-1 w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300">Email Address *</label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="owner@library.com"
                  className="mt-1 w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-brand-500"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300">Phone Number *</label>
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="9876543210"
                  className="mt-1 w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-brand-500"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Choose Password *</label>
              <input
                type="password"
                {...register('password')}
                placeholder="At least 6 characters"
                className="mt-1 w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-brand-500"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="mt-2 w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-500 disabled:opacity-50"
            >
              {registerMutation.isPending ? 'Creating Account…' : 'Continue to Library Setup →'}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
