import React from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  size = 'md',
}: TabsProps<T>) {
  const paddingClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm';

  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] overflow-x-auto max-w-full ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 rounded-xl font-bold whitespace-nowrap transition-all duration-150 select-none cursor-pointer ${paddingClass} ${
              isActive
                ? 'bg-[var(--brand-primary)] !text-white shadow-md shadow-blue-950/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--bg-surface)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
