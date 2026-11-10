import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate } from 'react-router-dom';
import { useLogin, useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { BookOpen, Moon, Sun, ArrowRight, Lock, Mail } from 'lucide-react';
import { Button } from '../components/ui';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const login = useLogin();
  const { theme, toggleTheme } = useTheme();

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
          className="rounded-xl p-2.5 border transition glass-card text-slate-300 hover:text-white cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-400" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-500/30 border border-indigo-400/40">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>
            StudySpace OS
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Universal cloud platform for study halls, reading rooms & libraries
          </p>
        </div>

        {/* Glass Card */}
        <div className="rounded-3xl border glass-panel p-8 shadow-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
              Sign in to your library account
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to access your administrative workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full rounded-xl glass-input pl-10 pr-4 py-2.5 text-sm outline-none"
                  placeholder="admin@atlas.com"
                />
              </div>
              {errors.email && (
                <p role="alert" className="mt-1 text-xs text-rose-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full rounded-xl glass-input pl-10 pr-4 py-2.5 text-sm outline-none"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p role="alert" className="mt-1 text-xs text-rose-400">
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

          <div className="pt-4 border-t text-center text-xs text-slate-400" style={{ borderColor: 'var(--glass-border)' }}>
            Don't have an account for your library?{' '}
            <Link to="/register" className="font-bold text-indigo-400 hover:text-indigo-300">
              Register Library →
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          StudySpace OS · Cloud Multi-Tenant Architecture
        </p>
      </div>
    </div>
  );
}
