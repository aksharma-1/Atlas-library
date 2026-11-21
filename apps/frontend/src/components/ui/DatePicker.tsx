import React, { useState, useRef, useEffect, useLayoutEffect, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';

export interface DatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: string; // 'YYYY-MM-DD'
  maxDate?: string; // 'YYYY-MM-DD'
  disabled?: boolean;
  required?: boolean;
  className?: string;
  size?: 'sm' | 'md';
  error?: string;
  helperText?: string;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function parseISODate(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function toISODate(year: number, month: number, day: number): string {
  const y = year;
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date...',
  minDate,
  maxDate,
  disabled = false,
  required = false,
  className = '',
  size = 'md',
  error,
  helperText,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 320,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  // Current view month & year in the calendar
  const today = useMemo(() => new Date(), []);
  const todayISO = useMemo(
    () => toISODate(today.getFullYear(), today.getMonth(), today.getDate()),
    [today]
  );

  const parsedValue = useMemo(() => parseISODate(value), [value]);

  const [viewYear, setViewYear] = useState<number>(() => {
    return parsedValue ? parsedValue.year : today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return parsedValue ? parsedValue.month : today.getMonth();
  });

  // Whenever value changes externally and is valid, sync view month & year
  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
    }
  }, [value]);

  // Dynamic positioning & boundary collision calculation
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const popoverWidth = Math.min(320, viewportWidth - 24);
    const popoverHeight = popoverRef.current?.offsetHeight || 350;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUp = spaceBelow < popoverHeight && spaceAbove > spaceBelow;
    setOpenUpward(shouldOpenUp);

    let top = shouldOpenUp ? rect.top - popoverHeight - 8 : rect.bottom + 8;
    if (top < 8) top = 8;
    if (top + popoverHeight > viewportHeight - 8) {
      top = Math.max(8, viewportHeight - popoverHeight - 8);
    }

    // Horizontal collision: if popover extends beyond right edge, align with trigger's right edge
    let left = rect.left;
    if (left + popoverWidth > viewportWidth - 16) {
      left = rect.right - popoverWidth;
    }
    // Safety clamp within viewport
    if (left < 16) left = 16;
    if (left + popoverWidth > viewportWidth - 16) {
      left = Math.max(16, viewportWidth - popoverWidth - 16);
    }

    setCoords({ top, left, width: popoverWidth });
  };

  // Synchronous pre-paint positioning to eliminate any FOUC / flicker
  useLayoutEffect(() => {
    if (!isOpen) {
      setIsPositioned(false);
      return;
    }
    updatePosition();
    setIsPositioned(true);

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsPositioned(true);
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setIsPositioned(false);
    }
  };

  // Click outside to close (handles portaled popover cleanly)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Human readable string: e.g. "21 Nov 2026"
  const formattedDisplay = useMemo(() => {
    if (!parsedValue) return '';
    const d = new Date(parsedValue.year, parsedValue.month, parsedValue.day);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [parsedValue]);

  // Navigation handlers
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDate = (day: number) => {
    const selected = toISODate(viewYear, viewMonth, day);
    onChange(selected);
    setIsOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(todayISO);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Calendar matrix calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Range checks
  const isDateDisabled = (year: number, month: number, day: number) => {
    const iso = toISODate(year, month, day);
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    return false;
  };

  const isToday = (day: number) => {
    return (
      viewYear === today.getFullYear() &&
      viewMonth === today.getMonth() &&
      day === today.getDate()
    );
  };

  const isSelected = (day: number) => {
    if (!parsedValue) return false;
    return (
      viewYear === parsedValue.year &&
      viewMonth === parsedValue.month &&
      day === parsedValue.day
    );
  };

  const paddingClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between rounded-xl border bg-white dark:bg-slate-900 transition-all duration-150 cursor-pointer select-none text-left ${paddingClass} ${
          error
            ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/30'
            : isOpen
            ? 'border-[#1E3A8A] dark:border-blue-500 ring-2 ring-[#1E3A8A]/20 dark:ring-blue-500/20 shadow-sm'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
      >
        <span className="min-w-0 flex-1 flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-[#1E3A8A] dark:text-blue-400 shrink-0" />
          {formattedDisplay ? (
            <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-xs sm:text-sm truncate">
              {formattedDisplay}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 font-normal text-xs sm:text-sm truncate">{placeholder}</span>
          )}
        </span>

        {value && !disabled && !required && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            title="Clear date"
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0 ml-1.5 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {/* Calendar Dropdown Popover (Portaled to document.body to avoid clipping inside modals/overflow containers) */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 10001,
              visibility: isPositioned ? 'visible' : 'hidden',
              boxShadow:
                '0 20px 40px -10px rgba(0, 0, 0, 0.25), 0 10px 16px -6px rgba(0, 0, 0, 0.15)',
            }}
            className={`rounded-2xl border bg-white dark:bg-slate-900 p-4 shadow-2xl border-slate-200 dark:border-slate-800 select-none ${
              openUpward
                ? 'animate-dropdown-up origin-bottom'
                : 'animate-dropdown-down origin-top'
            }`}
          >
          {/* Calendar Header: Month, Year, and Navigation Arrows */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {MONTHS[viewMonth]}
              </span>
              <span className="font-extrabold text-sm text-[#1E3A8A] dark:text-blue-400 font-mono">
                {viewYear}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#EEF2FF] hover:text-[#1E3A8A] dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#EEF2FF] hover:text-[#1E3A8A] dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 pt-3 pb-1 text-center">
            {DAYS_OF_WEEK.map((d, idx) => (
              <span
                key={d}
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  idx === 0 || idx === 6
                    ? 'text-amber-600 dark:text-amber-400/90'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 pt-1">
            {/* Days from previous month */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => {
              const dayNum = daysInPrevMonth - firstDayOfWeek + idx + 1;
              return (
                <div
                  key={`prev-${idx}`}
                  className="h-8 sm:h-9 flex items-center justify-center text-xs text-slate-300 dark:text-slate-700 font-medium select-none"
                >
                  {dayNum}
                </div>
              );
            })}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const disabledDay = isDateDisabled(viewYear, viewMonth, dayNum);
              const selectedDay = isSelected(dayNum);
              const todayDay = isToday(dayNum);

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleSelectDate(dayNum)}
                  className={`relative h-8 sm:h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all duration-150 cursor-pointer select-none ${
                    selectedDay
                      ? 'bg-[#1E3A8A] dark:bg-blue-600 !text-white font-bold shadow-md shadow-blue-950/30 scale-105 z-10'
                      : todayDay
                      ? 'border border-[#F59E0B] text-[#F59E0B] dark:text-amber-400 font-bold bg-amber-500/10 hover:bg-[#1E3A8A] hover:text-white dark:hover:bg-blue-600'
                      : disabledDay
                      ? 'opacity-25 cursor-not-allowed text-slate-400'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-[#EEF2FF] dark:hover:bg-slate-800 hover:text-[#1E3A8A] dark:hover:text-blue-300'
                  }`}
                >
                  <span>{dayNum}</span>
                  {todayDay && !selectedDay && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#F59E0B]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Footer Shortcuts */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="flex items-center gap-1 font-bold text-[#1E3A8A] dark:text-blue-400 hover:underline cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Today</span>
            </button>

            {value && (
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {value}
              </span>
            )}
          </div>
          </div>,
          document.body
        )}

      {error && <p className="mt-1 text-[11px] text-rose-500 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
