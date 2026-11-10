import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useForgotPassword, useResetPassword } from '../hooks/useAuth';

const requestSchema = z.object({
  email: z.string().email('Enter a valid email address').trim().toLowerCase(),
});

const resetSchema = z.object({
  otp: z.string().min(4, 'Enter the 6-digit code').trim(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RequestForm = z.infer<typeof requestSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const forgotPassword = useForgotPassword();
  const resetPassword = useResetPassword();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: requestErrors },
  } = useForm<RequestForm>({ resolver: zodResolver(requestSchema) });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const onRequestSubmit = (data: RequestForm) => {
    setErrorMessage(null);
    setEmail(data.email);
    forgotPassword.mutate(
      { email: data.email },
      {
        onSuccess: (res) => {
          setInfoMessage(res.message);
          setStep('reset');
        },
        onError: (err: any) => {
          setErrorMessage(err?.response?.data?.error || 'Failed to request reset code');
        },
      },
    );
  };

  const onResetSubmit = (data: ResetForm) => {
    setErrorMessage(null);
    resetPassword.mutate(
      {
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      },
      {
        onSuccess: (res) => {
          alert(res.message);
          navigate('/login');
        },
        onError: (err: any) => {
          setErrorMessage(err?.response?.data?.error || 'Failed to reset password');
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-900 px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <span className="text-5xl">🔐</span>
          <h1 className="mt-3 text-2xl font-black tracking-wide text-white">StudySpace OS</h1>
          <p className="mt-1 text-sm text-slate-400">Account Recovery & Security</p>
        </div>

        <div className="rounded-xl border border-surface-700 bg-surface-800 p-8 shadow-2xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {step === 'request' ? 'Reset Your Password' : 'Enter 6-Digit Code'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {step === 'request'
                ? "Enter your registered email address and we'll send you a 6-digit recovery code."
                : `We have sent a verification code to ${email}.`}
            </p>
          </div>

          {infoMessage && (
            <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-2.5 text-xs text-brand-300">
              {infoMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
              {errorMessage}
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleSubmitRequest(onRequestSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Email Address</label>
                <input
                  type="email"
                  {...registerRequest('email')}
                  placeholder="owner@library.com"
                  className="w-full rounded-lg border border-surface-600 bg-surface-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-500"
                />
                {requestErrors.email && (
                  <p className="text-xs text-red-400 mt-1">{requestErrors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={forgotPassword.isPending}
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-50"
              >
                {forgotPassword.isPending ? 'Sending Code…' : 'Send Recovery Code →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  {...registerReset('otp')}
                  placeholder="123456"
                  className="w-full rounded-lg border border-surface-600 bg-surface-700 px-4 py-2.5 text-center text-lg font-mono tracking-widest text-white placeholder-slate-500 outline-none focus:border-brand-500"
                />
                {resetErrors.otp && (
                  <p className="text-xs text-red-400 mt-1">{resetErrors.otp.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  {...registerReset('newPassword')}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-surface-600 bg-surface-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-500"
                />
                {resetErrors.newPassword && (
                  <p className="text-xs text-red-400 mt-1">{resetErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  {...registerReset('confirmPassword')}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-surface-600 bg-surface-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-500"
                />
                {resetErrors.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">{resetErrors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={resetPassword.isPending}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {resetPassword.isPending ? 'Updating Password…' : 'Set New Password & Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 mt-2"
              >
                ← Back / Re-enter Email
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-surface-700 text-center text-xs text-slate-400">
            Remembered your password?{' '}
            <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300">
              Sign in →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
