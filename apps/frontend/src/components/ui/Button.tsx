import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2 font-semibold',
    lg: 'px-6 py-3.5 text-base rounded-2xl gap-2.5 font-bold',
  }[size];

  const variantStyles = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 !text-white shadow-md shadow-indigo-600/20 border border-indigo-500',
    secondary:
      'bg-slate-800 hover:bg-slate-700 !text-white border border-slate-700 shadow-sm dark:bg-slate-800 light:bg-slate-800',
    outline:
      'bg-transparent hover:bg-slate-500/10 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30 hover:border-rose-500/50',
    ghost:
      'bg-transparent hover:bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
    glass:
      'glass-panel hover:bg-white/10 text-slate-900 dark:text-white border-slate-200 dark:border-white/10 shadow-sm',
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'brand', className = '' }: BadgeProps) {
  const styles = {
    brand: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30',
    neutral: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600/50',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles} ${className}`}
    >
      {children}
    </span>
  );
}
