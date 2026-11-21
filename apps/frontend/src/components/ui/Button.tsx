import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'glass';
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
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5 font-semibold',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2 font-bold',
    lg: 'px-6 py-3.5 text-base rounded-2xl gap-2.5 font-extrabold',
  }[size];

  const variantStyles = {
    primary:
      'bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] !text-white shadow-md shadow-blue-950/25 border border-transparent hover:shadow-blue-950/40 active:scale-[0.98]',
    accent:
      'bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] !text-slate-950 font-black shadow-md shadow-amber-500/25 border border-transparent active:scale-[0.98]',
    secondary:
      'bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-xs',
    outline:
      'bg-transparent hover:bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] border border-[var(--border-medium)] hover:border-[var(--border-focus)]',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:border-rose-500/50',
    ghost:
      'bg-transparent hover:bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
    glass:
      'glass-panel hover:bg-white/10 text-[var(--text-primary)] border-[var(--border-subtle)] shadow-xs',
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export function Badge({
  children,
  variant = 'brand',
  size = 'md',
  className = '',
  icon,
}: BadgeProps) {
  const styles = {
    brand:
      'bg-[var(--brand-subtle)] text-[var(--brand-text)] border-blue-200 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300',
    accent:
      'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/40',
    success:
      'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    warning:
      'bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    danger:
      'bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
    neutral:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  }[variant];

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold border transition-colors select-none ${sizeClass} ${styles} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
