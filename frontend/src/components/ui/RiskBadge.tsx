import React from 'react';

interface RiskBadgeProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md' }) => {
  const normalized = (level || 'LOW').toUpperCase();

  const styles = {
    HIGH: 'bg-[#C9685B]/10 text-[#C9685B] border-[#C9685B]/25 dark:bg-[#C9685B]/15 dark:text-[#E08579] dark:border-[#C9685B]/30',
    MEDIUM: 'bg-[#C18A3A]/10 text-[#C18A3A] border-[#C18A3A]/25 dark:bg-[#C18A3A]/15 dark:text-[#E5A855] dark:border-[#C18A3A]/30',
    LOW: 'bg-[#4F8A70]/10 text-[#4F8A70] border-[#4F8A70]/25 dark:bg-[#4F8A70]/15 dark:text-[#6CB294] dark:border-[#4F8A70]/30',
  }[normalized] || 'bg-zinc-100 text-[#6B6B6F] border-black/10 dark:bg-zinc-800 dark:text-zinc-300 dark:border-white/10';

  const dotStyles = {
    HIGH: 'bg-[#C9685B]',
    MEDIUM: 'bg-[#C18A3A]',
    LOW: 'bg-[#4F8A70]',
  }[normalized] || 'bg-[#6B6B6F]';

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
