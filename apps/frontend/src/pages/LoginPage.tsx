import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate } from 'react-router-dom';
import { useLogin, useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, ArrowRight, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Button, Logo } from '../components/ui';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const login = useLogin();
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  // Already logged in → redirect based on role and subscription
  if (!isLoading && isAuthenticated) {
    if (user?.role === 'superadmin') {
      return <Navigate to="/admin" replace />;
    }
    if (user?.subscriptionStatus === 'pending_payment') {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = (data: LoginForm) => {
    login.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="rounded-xl p-2.5 border transition border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer shadow-xs"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-600" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex justify-center">
            <Logo size="xl" showDomain={true} />
          </div>
          <p className="text-xs text-[var(--text-tertiary)] max-w-xs mx-auto font-normal">
            Universal cloud platform for study halls, reading rooms & libraries · abhyasroom.in
          </p>
        </div>

        {/* Glass Card */}
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-elevated)] space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Sign in to your library account
            </h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 font-normal">
              Enter your credentials to access your administrative workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--text-tertiary)]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-medium)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-indigo-500/20 pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition"
                  placeholder="admin@atlas.com"
                />
              </div>
              {errors.email && (
                <p role="alert" className="mt-1 text-xs text-rose-500 font-semibold">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-[var(--text-secondary)]"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--text-tertiary)]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-medium)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[#1E3A8A]/20 dark:focus:ring-blue-500/20 pl-10 pr-10 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] focus:outline-none transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p role="alert" className="mt-1 text-xs text-rose-500 font-semibold">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Server error */}
            {login.isError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300"
              >
                {(login.error as any)?.response?.data?.error ||
                  'Invalid email or password. Please try again or use the recovery flow.'}
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              size="lg"
              className="w-full shadow-xl"
              isLoading={login.isPending}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Sign in to Dashboard
            </Button>
          </form>

          <div className="pt-4 border-t text-center text-xs text-[var(--text-tertiary)]" style={{ borderColor: 'var(--border-subtle)' }}>
            Don't have an account for your library?{' '}
            <Link to="/register" className="font-bold text-[#1E3A8A] dark:text-blue-400 hover:underline">
              Register Library →
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          AbhyasRoom · abhyasroom.in Cloud Platform
        </p>
      </div>
    </div>
  );
}
