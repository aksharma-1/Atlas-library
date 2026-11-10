import { Calendar, Sparkles } from 'lucide-react';

export type DurationOption = '30d' | '60d' | '90d' | 'custom';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChangeStartDate: (date: string) => void;
  onChangeEndDate: (date: string) => void;
  durationOption: DurationOption;
  onChangeDurationOption: (option: DurationOption) => void;
  label?: string;
}

/**
 * Calculates a target end date based on a start date string (YYYY-MM-DD) and number of days.
 * 30 days total inclusive means: EndDate = startDate + (days - 1) days.
 * E.g., Start Nov 10 for 30 days => End Dec 09 (exactly 30 days of library access).
 */
export function calculateEndDateFromDays(startDateStr: string, days: number): string {
  if (!startDateStr) return '';
  const [year, month, day] = startDateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  // Add (days - 1) days so total inclusive days is exactly `days`
  date.setDate(date.getDate() + (days - 1));
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatHumanDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function DateRangeDurationSelector({
  startDate,
  endDate,
  onChangeStartDate,
  onChangeEndDate,
  durationOption,
  onChangeDurationOption,
  label = 'Membership Validity & Duration',
}: DateRangePickerProps) {
  const handleSelectDuration = (option: DurationOption) => {
    onChangeDurationOption(option);
    if (option === '30d') {
      onChangeEndDate(calculateEndDateFromDays(startDate, 30));
    } else if (option === '60d') {
      onChangeEndDate(calculateEndDateFromDays(startDate, 60));
    } else if (option === '90d') {
      onChangeEndDate(calculateEndDateFromDays(startDate, 90));
    }
  };

  const handleStartDateChange = (newStart: string) => {
    onChangeStartDate(newStart);
    if (durationOption === '30d') {
      onChangeEndDate(calculateEndDateFromDays(newStart, 30));
    } else if (durationOption === '60d') {
      onChangeEndDate(calculateEndDateFromDays(newStart, 60));
    } else if (durationOption === '90d') {
      onChangeEndDate(calculateEndDateFromDays(newStart, 90));
    }
  };

  return (
    <div className="space-y-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/80 p-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-indigo-500" />
          {label}
        </label>
        <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Auto 30-Day Cycle
        </span>
      </div>

      {/* Quick Duration Chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => handleSelectDuration('30d')}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            durationOption === '30d'
              ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
          }`}
        >
          1 Month (30 Days)
        </button>
        <button
          type="button"
          onClick={() => handleSelectDuration('60d')}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            durationOption === '60d'
              ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
          }`}
        >
          2 Months (60 Days)
        </button>
        <button
          type="button"
          onClick={() => handleSelectDuration('90d')}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            durationOption === '90d'
              ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
          }`}
        >
          3 Months (90 Days)
        </button>
        <button
          type="button"
          onClick={() => handleSelectDuration('custom')}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            durationOption === 'custom'
              ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
          }`}
        >
          Custom Date
        </button>
      </div>

      {/* Date Pickers */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            End Date (Auto-filled)
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              onChangeDurationOption('custom');
              onChangeEndDate(e.target.value);
            }}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>
      </div>

      {/* Helper preview text */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
        <span>Valid: <strong className="text-slate-700 dark:text-slate-200">{formatHumanDate(startDate)}</strong> → <strong className="text-slate-700 dark:text-slate-200">{formatHumanDate(endDate)}</strong></span>
        {durationOption !== 'custom' && (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Expiry calculated</span>
        )}
      </div>
    </div>
  );
}
