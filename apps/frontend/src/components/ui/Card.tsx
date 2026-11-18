import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function Card({ children, className = '', hoverEffect = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl p-6 glass-card ${
        hoverEffect ? 'hover:scale-[1.01] cursor-pointer' : ''
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
  accentColor?: 'brand' | 'emerald' | 'amber' | 'rose' | 'indigo';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive,
  accentColor = 'brand',
}: StatCardProps) {
  const accentGlow = {
    brand: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  }[accentColor];

  return (
    <div className="rounded-2xl glass-card p-4 sm:p-5 relative overflow-hidden group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {title}
          </p>
          <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight truncate" style={{ color: 'var(--text-main)' }}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-2.5 sm:p-3 rounded-xl border shrink-0 ${accentGlow} transition-transform group-hover:scale-105`}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-2.5 sm:mt-3 flex items-center gap-1.5 text-xs font-medium">
          <span className={trendPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}>
            {trendPositive ? '↑' : '↓'} {trend}
          </span>
          <span className="text-slate-400 text-[11px] sm:text-xs">vs last month</span>
        </div>
      )}
    </div>
  );
}
