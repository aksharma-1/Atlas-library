import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
  centered?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
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
    '2xl': 'max-w-3xl',
    '3xl': 'max-w-5xl',
    '4xl': 'max-w-6xl',
    full: 'max-w-7xl',
  }[maxWidth];

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9999] flex justify-center ${
        centered
          ? 'items-center p-3 sm:p-4'
          : 'items-end sm:items-center p-0 sm:p-4'
      }`}
    >
      {/* Backdrop with smooth fade */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity animate-modal-backdrop cursor-pointer"
      />

      {/* Dialog box / Mobile Bottom Sheet: Outer container strictly preserves border-radius */}
      <div
        className={`relative w-full ${maxWidthClass} ${
          centered
            ? 'rounded-3xl my-auto animate-modal-content'
            : 'rounded-t-3xl sm:rounded-3xl sm:my-auto animate-bottom-sheet sm:animate-modal-content'
        } bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] shadow-[var(--shadow-elevated)] z-10 max-h-[90vh] flex flex-col overflow-hidden text-[var(--text-primary)]`}
      >
        {/* Pinned Header */}
        <div className="shrink-0 flex items-start justify-between border-b border-[var(--border-subtle)] p-4 sm:p-5 bg-[var(--bg-surface-elevated)] relative">
          {/* Mobile drag handle for bottom sheets */}
          {!centered && (
            <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700/80 pointer-events-none" />
          )}

          <div className="flex items-center gap-3 min-w-0 pr-3">
            {icon && (
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 shrink-0 transition-transform duration-200 group-hover:scale-105">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate">{title}</h3>
              {subtitle && <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close dialog"
            className="rounded-xl p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200 hover:rotate-90 cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body: Inset scrollbar strictly contained inside and never clips outer rounded borders */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6 custom-modal-scrollbar">
          {children}
        </div>

        {/* Optional Pinned Footer: always visible at the bottom, never clipped or pushed off screen */}
        {footer && (
          <div className="shrink-0 border-t border-[var(--border-subtle)] p-4 sm:px-6 bg-[var(--bg-surface-elevated)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
