import React from 'react';
import { AppleVision3DCard } from '../ui/AppleVision3DCard';
import { ShieldAlert, Sparkles, Activity } from 'lucide-react';

interface Apple3DRiskGaugeProps {
  probability: number;
  riskLevel: string;
  patientName: string;
  appointmentTime: string;
}

export const Apple3DRiskGauge: React.FC<Apple3DRiskGaugeProps> = ({
  probability,
  riskLevel,
  patientName,
  appointmentTime,
}) => {
  const pct = Math.round(probability * 100);
  const isHigh = riskLevel === 'HIGH';
  const isMedium = riskLevel === 'MEDIUM';

  const strokeColor = isHigh ? '#E11D48' : isMedium ? '#D97706' : '#15803D';
  const glowColor = isHigh ? 'rgba(225, 29, 72, 0.2)' : isMedium ? 'rgba(217, 119, 6, 0.15)' : 'rgba(21, 128, 61, 0.15)';

  return (
    <AppleVision3DCard
      depth={22}
      translateDepth={55}
      glowColor={glowColor}
      className={`w-full max-w-sm p-8 rounded-[32px] flex flex-col items-center text-center relative overflow-hidden bg-white border ${
        isHigh ? 'border-rose-200 shadow-[0_24px_64px_-16px_rgba(225,29,72,0.15)]' : 'border-slate-200 shadow-xl shadow-slate-200/50'
      }`}
    >
      {/* 3D Circular Radar Gauge Layer */}
      <div
        style={{ transform: 'translateZ(50px)', transformStyle: 'preserve-3d' }}
        className="relative w-52 h-52 flex items-center justify-center my-3"
      >
        {/* Outer Rotating Radar Ticks */}
        <div className="absolute inset-0 rounded-full border border-dashed border-slate-200 animate-[spin_40s_linear_infinite]" />

        {/* Outer Ring */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="48"
            className="stroke-slate-100"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="60"
            cy="60"
            r="48"
            stroke={strokeColor}
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 48}
            strokeDashoffset={2 * Math.PI * 48 * (1 - probability)}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Floating Spatial Core with Deep Z-Elevation */}
        <div
          style={{ transform: 'translateZ(40px)' }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <span className="text-5xl font-black font-mono tracking-tight text-slate-900 leading-none">
            {pct}%
          </span>
          <span
            style={{ color: strokeColor }}
            className="text-[10px] uppercase font-bold tracking-widest mt-1.5 font-mono px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200"
          >
            {riskLevel} RISK
          </span>
          <span className="text-[10px] text-slate-500 mt-1 font-semibold">
            Missed Probability
          </span>
        </div>
      </div>

      {/* Detail Footer with Z-Depth */}
      <div
        style={{ transform: 'translateZ(25px)' }}
        className="mt-4 pt-4 border-t border-slate-100 w-full text-center space-y-1"
      >
        <span className="text-xs font-bold text-slate-900 block">
          ML Model Telemetry ({patientName})
        </span>
        <span className="text-[11px] text-slate-500 block font-mono">
          Slot: {appointmentTime} · Accuracy 94.2% ROC-AUC
        </span>
      </div>
    </AppleVision3DCard>
  );
};
