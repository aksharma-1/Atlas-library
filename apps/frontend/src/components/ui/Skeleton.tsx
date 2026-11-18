import type { CSSProperties } from 'react';

export interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800/80 ${className}`}
    />
  );
}

/**
 * Common Stat Card Skeleton (matching StatCard geometry)
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl glass-card p-4 sm:p-5 border border-slate-200 dark:border-slate-800/80 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Common Table Rows Skeleton
 */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      <div className="flex items-center gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-slate-800/50">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          {Array.from({ length: cols - 1 }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Visual Seating Grid Skeleton (Grid of seats)
 */
export function SeatGridSkeleton({ count = 24 }: { count?: number }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-2.5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-24 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-800/40 p-2.5 flex flex-col items-center justify-between"
        >
          <Skeleton className="h-3.5 w-6" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-2.5 w-10" />
        </div>
      ))}
    </div>
  );
}

/**
 * Full Page Skeleton wrapper
 */
export function PageHeaderSkeleton({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="space-y-2 mb-6 animate-pulse">
      <Skeleton className="h-8 w-48 sm:w-64" />
      {subtitle && <Skeleton className="h-4 w-72 sm:w-96" />}
    </div>
  );
}
