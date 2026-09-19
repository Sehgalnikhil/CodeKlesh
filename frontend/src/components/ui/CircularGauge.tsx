import React from 'react';
import { motion } from 'framer-motion';

interface CircularGaugeProps {
  probability: number; // 0.0 - 1.0
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  size?: number;
  strokeWidth?: number;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  probability,
  riskLevel,
  size = 180,
  strokeWidth = 14,
}) => {
  const percentage = Math.round(probability * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorConfig = {
    HIGH: {
      stroke: '#f43f5e', // rose-500
      glow: 'rgba(244, 63, 94, 0.18)',
      text: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    },
    MEDIUM: {
      stroke: '#f59e0b', // amber-500
      glow: 'rgba(245, 158, 11, 0.18)',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    },
    LOW: {
      stroke: '#10b981', // emerald-500
      glow: 'rgba(16, 185, 129, 0.18)',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    },
  }[riskLevel] || {
    stroke: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.18)',
    text: 'text-brand-600',
    badge: 'bg-brand-50 text-brand-700',
  };

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="rotate-[-90deg] overflow-visible"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-zinc-100 dark:text-zinc-800"
            fill="transparent"
          />
          {/* Animated Value circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colorConfig.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
            fill="transparent"
            style={{
              filter: `drop-shadow(0 2px 8px ${colorConfig.glow})`,
            }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className={`text-4xl font-bold tracking-tight ${colorConfig.text}`}
          >
            {percentage}%
          </motion.span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Probability
          </span>
        </div>
      </div>

      {/* Risk Badge under gauge */}
      <div className="mt-3">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${colorConfig.badge}`}
        >
          {riskLevel} RISK
        </span>
      </div>
    </div>
  );
};
