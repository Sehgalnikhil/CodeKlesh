import React, { useState, useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { AppleVision3DCard } from '../ui/AppleVision3DCard';
import { Appointment } from '../../types';
import { Sparkles, Clock, AlertTriangle, CheckCircle2, User, ChevronRight } from 'lucide-react';

interface AppleSpatialScheduleBoardProps {
  appointments: Appointment[];
  selectedId?: number;
  onSelectAppointment: (app: Appointment) => void;
}

export const AppleSpatialScheduleBoard: React.FC<AppleSpatialScheduleBoardProps> = ({
  appointments,
  selectedId,
  onSelectAppointment,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'UNCONFIRMED'>('ALL');

  // Stage parallax spring tracking mouse across the viewport
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 30, stiffness: 180 };
  const stageRotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), springConfig);
  const stageRotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleStageMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const filtered = appointments.filter((a) => {
    if (filter === 'HIGH') return a.prediction?.risk_level === 'HIGH';
    if (filter === 'UNCONFIRMED') return a.confirmation_status !== 'Confirmed';
    return true;
  }).slice(0, 5);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleStageMouseMove}
      onMouseLeave={handleStageMouseLeave}
      className="relative w-full py-8 px-6 rounded-[36px] vision-glass border border-white/15 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.85)] overflow-hidden perspective-1600 select-none"
    >
      {/* VisionOS Specular Glow Backdrop */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header Controls */}
      <div className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 px-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
              Apple Spatial Schedule Radar
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-0.5 tracking-tight">
            Live Clinical Capacity Grid
          </h3>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-full vision-dock self-start sm:self-auto border border-white/10">
          {(['ALL', 'HIGH', 'UNCONFIRMED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all ${
                filter === tab
                  ? 'bg-white text-stone-950 shadow-md font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab === 'ALL' ? 'All Slots' : tab === 'HIGH' ? 'High Risk' : 'Unconfirmed'}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Spatial Parallax Stage */}
      <motion.div
        style={{
          rotateX: stageRotateX,
          rotateY: stageRotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative z-10 py-8 px-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filtered.map((app, index) => {
          const prob = Math.round((app.prediction?.risk_probability || 0.15) * 100);
          const isHigh = app.prediction?.risk_level === 'HIGH';
          const isMedium = app.prediction?.risk_level === 'MEDIUM';
          const isConfirmed = app.confirmation_status === 'Confirmed';
          const isSelected = selectedId === app.id;

          // Distinct 3D Z-depth for spatial layering
          const baseZ = isSelected ? 80 : isHigh ? 50 : isMedium ? 15 : -15;

          return (
            <div
              key={app.id}
              style={{
                transform: `translateZ(${baseZ}px)`,
                transformStyle: 'preserve-3d',
              }}
              className="transition-transform duration-500"
            >
              <AppleVision3DCard
                depth={16}
                translateDepth={45}
                isSelected={isSelected}
                onClick={() => onSelectAppointment(app)}
                glowColor={
                  isHigh
                    ? 'rgba(239, 68, 68, 0.4)'
                    : isMedium
                    ? 'rgba(245, 158, 11, 0.35)'
                    : 'rgba(16, 185, 129, 0.3)'
                }
                className={`p-6 rounded-[28px] ${
                  isHigh
                    ? 'border-red-500/40 bg-red-950/20'
                    : isSelected
                    ? 'border-cyan-400/50'
                    : 'border-white/10'
                }`}
              >
                {/* 3D Content Layers */}
                <div style={{ transform: 'translateZ(25px)' }} className="space-y-4">
                  {/* Top: Time & Risk Pill */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/50" />
                      <span className="text-xs font-mono font-bold text-white">
                        {app.appointment_time}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border shadow-sm ${
                        isHigh
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : isMedium
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {prob}% RISK
                    </span>
                  </div>

                  {/* Middle: Patient Name & Department with Extra Z-Elevation */}
                  <div style={{ transform: 'translateZ(30px)' }}>
                    <h4 className="text-base font-bold text-white tracking-tight">
                      {app.patient?.first_name} {app.patient?.last_name}
                    </h4>
                    <p className="text-xs text-white/60 mt-0.5">
                      {app.doctor_name} · {app.department}
                    </p>
                  </div>

                  {/* Bottom: Status & Valuation */}
                  <div
                    style={{ transform: 'translateZ(18px)' }}
                    className="pt-3 border-t border-white/10 flex items-center justify-between text-xs"
                  >
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                        isConfirmed ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isConfirmed ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                        }`}
                      />
                      {app.confirmation_status || 'Unconfirmed'}
                    </span>

                    <span className="text-[11px] font-mono font-bold text-white/90">
                      ₹{(app.estimated_slot_value || 2200).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </AppleVision3DCard>
            </div>
          );
        })}
      </motion.div>

      {/* Subtle Spatial Footer Hint */}
      <div className="relative z-20 px-2 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Move cursor to tilt spatial perspective · Click card to focus
        </span>
        <span className="font-mono text-cyan-400 font-semibold">Spatial Z-Depth Active</span>
      </div>
    </div>
  );
};
