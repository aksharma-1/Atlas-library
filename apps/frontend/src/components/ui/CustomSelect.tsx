import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  disabled = false,
  required = false,
  className = '',
  error,
  searchable = false,
  searchPlaceholder = 'Search options...',
  size = 'md',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState(240);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  // Dynamically calculate placement (upward vs downward) and max height based on available viewport space
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Desired dropdown height with safety margin
      const padding = 16;
      const shouldOpenUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      setOpenUpward(shouldOpenUp);

      const availableSpace = shouldOpenUp ? spaceAbove - padding : spaceBelow - padding;
      // Cap height between 140px and 280px so it never exceeds visible space or causes scroll breaking
      const optimalHeight = Math.max(140, Math.min(Math.floor(availableSpace), 280));
      setDropdownMaxHeight(optimalHeight);
    }
  }, [isOpen]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, searchable]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredOptions = searchQuery.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (opt.badge && opt.badge.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-lg',
    md: 'px-3.5 py-2 text-xs sm:text-sm rounded-xl',
    lg: 'px-4 py-2.5 text-sm rounded-xl',
  }[size];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300"
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
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2.5 ${sizeClasses} border transition-all duration-150 text-left cursor-pointer select-none bg-white dark:bg-slate-900 shadow-xs ${
          isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 dark:ring-indigo-500/30'
            : error
            ? 'border-rose-400 dark:border-rose-600'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          {selectedOption ? (
            <span className="text-slate-900 dark:text-slate-100 font-semibold truncate">
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 font-normal">{placeholder}</span>
          )}
          {selectedOption?.badge && (
            <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] px-1.5 py-0.5 font-bold border border-indigo-200 dark:border-indigo-800 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </span>

        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-indigo-500' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            maxHeight: `${dropdownMaxHeight}px`,
            boxShadow:
              '0 12px 30px -4px rgba(0, 0, 0, 0.15), 0 8px 12px -6px rgba(0, 0, 0, 0.1)',
          }}
          className={`absolute z-50 w-full rounded-2xl border bg-white dark:bg-slate-900 p-1.5 shadow-2xl border-slate-200 dark:border-slate-800 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {/* Optional Search Bar inside dropdown */}
          {(searchable || options.length > 7) && (
            <div className="p-1.5 mb-1 pb-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="px-3 py-4 text-xs text-slate-400 text-center">
              No matching options found
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      if (option.disabled) return;
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl cursor-pointer transition-colors duration-100 ${
                      option.disabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      {option.icon && <span className="shrink-0">{option.icon}</span>}
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate font-medium">{option.label}</p>
                          {option.badge && (
                            <span className="rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-1.5 py-0.2 font-semibold">
                              {option.badge}
                            </span>
                          )}
                        </div>
                        {option.description && (
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{option.description}</p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
