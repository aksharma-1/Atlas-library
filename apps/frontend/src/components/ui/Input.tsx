import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-[var(--text-secondary)]"
          >
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[var(--text-tertiary)] pointer-events-none shrink-0">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-xl bg-[var(--bg-surface-subtle)] border text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm transition-all duration-150 outline-none ${
              leftIcon ? 'pl-9' : 'pl-3.5'
            } ${rightIcon ? 'pr-9' : 'pr-3.5'} py-2.5 ${
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-[var(--border-medium)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[#1E3A8A]/20 dark:focus:ring-blue-500/25'
            } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-[var(--text-tertiary)] shrink-0">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs font-semibold text-rose-500 mt-1">{error}</p>}
        {!error && hint && (
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-bold text-[var(--text-secondary)]"
          >
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={`w-full rounded-xl bg-[var(--bg-surface-subtle)] border text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm p-3 transition-all duration-150 outline-none ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : 'border-[var(--border-medium)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[#1E3A8A]/20 dark:focus:ring-blue-500/25'
          } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error && <p className="text-xs font-semibold text-rose-500 mt-1">{error}</p>}
        {!error && hint && (
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
