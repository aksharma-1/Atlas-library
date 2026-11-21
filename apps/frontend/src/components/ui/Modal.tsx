import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  centered?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'md',
  centered = false,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9999] flex justify-center ${
        centered
          ? 'items-center p-4'
          : 'items-end sm:items-center p-0 sm:p-4'
      }`}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Dialog box / Mobile Bottom Sheet */}
      <div
        className={`relative w-full ${maxWidthClass} ${
          centered ? 'rounded-3xl my-auto' : 'rounded-t-3xl sm:rounded-3xl sm:my-auto'
        } bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] p-5 sm:p-6 shadow-[var(--shadow-elevated)] transition-all z-10 max-h-[92vh] overflow-y-auto overflow-x-hidden text-[var(--text-primary)] animate-in zoom-in-95 duration-200`}
      >
        <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-4 mb-5">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
              {subtitle && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
