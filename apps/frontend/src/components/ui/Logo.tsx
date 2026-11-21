import React from 'react';

export interface LogoProps {
  /** Size preset for icon and typography */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to render the 'AbhyasRoom' wordmark alongside the icon */
  showWordmark?: boolean;
  /** Whether to display the '.in' domain pill or badge */
  showDomain?: boolean;
  /** Optional custom container CSS classes */
  className?: string;
  /** Optional custom icon CSS classes */
  iconClassName?: string;
  /** Optional custom wordmark text CSS classes */
  wordmarkClassName?: string;
}

const sizeConfig = {
  xs: {
    icon: 'h-6 w-6 rounded-md p-0.5',
    text: 'text-sm',
    domain: 'text-[9px] px-1 py-0.2',
    gap: 'gap-1.5',
  },
  sm: {
    icon: 'h-7 w-7 rounded-lg p-0.5',
    text: 'text-base',
    domain: 'text-[10px] px-1.5 py-0.5',
    gap: 'gap-2',
  },
  md: {
    icon: 'h-9 w-9 rounded-xl p-0.5',
    text: 'text-lg',
    domain: 'text-[10px] px-1.5 py-0.5',
    gap: 'gap-2.5',
  },
  lg: {
    icon: 'h-11 w-11 rounded-xl p-1',
    text: 'text-2xl',
    domain: 'text-xs px-2 py-0.5',
    gap: 'gap-3',
  },
  xl: {
    icon: 'h-14 w-14 rounded-2xl p-1.5',
    text: 'text-3xl',
    domain: 'text-xs px-2.5 py-0.5',
    gap: 'gap-3.5',
  },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  showDomain = false,
  className = '',
  iconClassName = '',
  wordmarkClassName = '',
}) => {
  const currentSize = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={`inline-flex items-center ${currentSize.gap} select-none ${className}`}>
      {/* Favicon Symbol: Study room outline + open book + hanging lamp */}
      <img
        src="/abhyasroom-logo.png?v=2"
        alt="AbhyasRoom"
        className={`object-contain shadow-xs border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 ${currentSize.icon} ${iconClassName}`}
      />

      {/* Wordmark: Combination mark of "Abhyas" (Navy in Light / White in Dark) + "Room" (Orange) */}
      {showWordmark && (
        <div aria-label="AbhyasRoom" className={`flex items-baseline leading-none font-sans ${wordmarkClassName}`}>
          <span className={`font-black tracking-tight text-[#1E3A8A] dark:text-white ${currentSize.text}`}>
            Abhyas
          </span>
          <span className={`font-black tracking-tight text-[#F59E0B] ${currentSize.text}`}>
            Room
          </span>
          {showDomain && (
            <span className={`ml-1.5 font-bold uppercase tracking-wider rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${currentSize.domain}`}>
              .in
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
