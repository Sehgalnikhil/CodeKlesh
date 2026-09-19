import React from 'react';

interface RiskBadgeProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md' }) => {
  const normalized = (level || 'LOW').toUpperCase();

  const styles = {
    HIGH: 'bg-rose-50/80 text-rose-700 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40 shadow-[0_1px_4px_rgba(244,63,94,0.08)]',
    MEDIUM: 'bg-amber-50/80 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40 shadow-[0_1px_4px_rgba(245,158,11,0.08)]',
    LOW: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40 shadow-[0_1px_4px_rgba(16,185,129,0.08)]',
  }[normalized] || 'bg-zinc-50/80 text-zinc-700 border-zinc-200/60 dark:bg-zinc-800/40 dark:text-zinc-300 dark:border-zinc-700/40';

  const dotStyles = {
    HIGH: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
    MEDIUM: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    LOW: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  }[normalized] || 'bg-zinc-400';

  const sizeStyles = {
    sm: 'text-[10px] px-2.5 py-0.5 font-semibold tracking-wide',
    md: 'text-[11px] px-3 py-1 font-semibold tracking-wide',
    lg: 'text-xs px-3.5 py-1.5 font-bold tracking-wider',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md transition-all duration-200 ${styles} ${sizeStyles}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles}`} />
      <span>{normalized} RISK</span>
    </span>
  );
};
