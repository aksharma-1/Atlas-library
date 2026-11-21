import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate } from 'react-router-dom';
import { useRegister, useAuth } from '../hooks/useAuth';
import { Logo } from '../components/ui';
import { Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);

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
          <div className="inline-flex justify-center">
            <Logo size="xl" showDomain={true} />
          </div>
          <p className="mt-2 text-xs text-[var(--text-tertiary)] max-w-sm mx-auto font-normal">
            Register your library or study space on abhyasroom.in and start managing desks in minutes.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-elevated)] space-y-6">
          <div className="border-b border-[var(--border-subtle)] pb-3">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Create Library Account</h2>
            <p className="text-xs text-[var(--text-tertiary)]">Step 1 of 3: Account & Library Details</p>
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-rose-500 font-semibold">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)]">Library / Space Name *</label>
              <input
                type="text"
                {...register('libraryName')}
                placeholder="e.g. Apex Study Library"
                className="mt-1 w-full rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[#1E3A8A]/20 dark:focus:ring-blue-500/20"
              />
              {errors.libraryName && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.libraryName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)]">Owner Full Name *</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Rahul Sharma"
                  className="mt-1 w-full rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[#1E3A8A]/20 dark:focus:ring-blue-500/20"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)]">City / Location</label>
                <input
                  type="text"
                  {...register('city')}
                  placeholder="e.g. Indore"
                  className="mt-1 w-full rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[#1E3A8A]/20 dark:focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)]">Email Address *</label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="owner@library.com"
                  className="mt-1 w-full rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[#1E3A8A]/20 dark:focus:ring-blue-500/20"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)]">Phone Number *</label>
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="9876543210"
                  className="mt-1 w-full rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[#1E3A8A]/20 dark:focus:ring-blue-500/20"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)]">Choose Password *</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface-subtle)] pl-3.5 pr-10 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[#1E3A8A]/20 dark:focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] focus:outline-none transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="mt-2 w-full rounded-xl bg-[#1E3A8A] hover:bg-[#172554] dark:bg-blue-600 dark:hover:bg-blue-500 !text-white py-3 text-sm font-bold shadow-md shadow-blue-950/25 transition cursor-pointer disabled:opacity-50"
            >
              {registerMutation.isPending ? 'Creating Account…' : 'Continue to Library Setup →'}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-[var(--text-tertiary)]">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#1E3A8A] dark:text-blue-400 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
