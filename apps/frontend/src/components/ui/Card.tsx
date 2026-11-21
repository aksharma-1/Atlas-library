import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  variant?: 'surface' | 'subtle' | 'elevated' | 'glass';
}

export function Card({
  children,
  className = '',
  hoverEffect = false,
  variant = 'surface',
  ...props
}: CardProps) {
  const variantStyles = {
    surface: 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)]',
    subtle: 'bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]',
    elevated: 'bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] shadow-[var(--shadow-elevated)]',
    glass: 'glass-card',
  }[variant];

  return (
    <div
      className={`rounded-2xl p-6 text-[var(--text-primary)] transition-all duration-200 ${variantStyles} ${
        hoverEffect ? 'hover:scale-[1.01] hover:border-[var(--border-focus)] cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  accentColor?: 'brand' | 'navy' | 'orange' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'blue';
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive,
  accentColor = 'brand',
  onClick,
}: StatCardProps) {
  const accentStyles = {
    brand: 'text-[#1E3A8A] dark:text-blue-300 bg-[#EEF2FF] dark:bg-blue-950/40 border-[#C7D2FE] dark:border-blue-800',
    navy: 'text-[#1E3A8A] dark:text-blue-300 bg-[#EEF2FF] dark:bg-blue-950/40 border-[#C7D2FE] dark:border-blue-800',
    orange: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    blue: 'text-[#1E3A8A] dark:text-blue-300 bg-[#EEF2FF] dark:bg-blue-950/40 border-[#C7D2FE] dark:border-blue-800',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    indigo: 'text-[#1E3A8A] dark:text-blue-300 bg-[#EEF2FF] dark:bg-blue-950/40 border-[#C7D2FE] dark:border-blue-800',
  }[accentColor];

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4 sm:p-5 relative overflow-hidden group transition-all duration-200 hover:border-[var(--border-focus)] hover:shadow-lg ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] truncate">
            {title}
          </p>
          <p className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)] truncate">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-[11px] sm:text-xs text-[var(--text-tertiary)] line-clamp-1 font-normal">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`p-2.5 sm:p-3 rounded-xl border shrink-0 ${accentStyles} transition-transform duration-200 group-hover:scale-105 shadow-xs`}
          >
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
          <span
            className={
              trendPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }
          >
            {trendPositive ? '↑' : '↓'} {trend}
          </span>
          <span className="text-[var(--text-muted)] text-[11px]">vs last month</span>
        </div>
      )}
    </div>
  );
}
