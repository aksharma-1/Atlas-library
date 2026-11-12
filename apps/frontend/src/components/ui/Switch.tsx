interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  activeColor?: 'indigo' | 'emerald' | 'blue';
  id?: string;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  activeColor = 'indigo',
  id,
  className = '',
}: SwitchProps) {
  const isSm = size === 'sm';

  const colorClasses = {
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-600',
    blue: 'bg-blue-600',
  }[activeColor];

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
        isSm ? 'h-5 w-9' : 'h-6 w-11'
      } ${
        checked ? colorClasses : 'bg-slate-300 dark:bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          isSm ? 'h-4 w-4' : 'h-5 w-5'
        } ${
          isSm
            ? checked
              ? 'translate-x-4'
              : 'translate-x-0.5'
            : checked
            ? 'translate-x-5'
            : 'translate-x-0.5'
        } mt-0.5`}
      />
    </button>
  );
}
