import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Appointment } from '../../types';
import {
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  User,
  Sparkles,
  ArrowRight,
  TrendingDown,
  ChevronRight,
  Check,
  Building2,
  Calendar,
} from 'lucide-react';

export interface Architectural3DTimelineProps {
  appointments: Appointment[];
  activeStage?: number; // 0: full timeline, 1: 10:30 risk forward, 2: factors visible, 3: waitlist convergence, 4: recovered
  selectedAppointmentId?: number | null;
  onSelectAppointment?: (app: Appointment) => void;
  isConfirmedLive?: boolean;
  isRecoveredLive?: boolean;
  focusedIndex?: number;
}

interface TileData {
  time: string;
  patientName: string;
  doctor: string;
  dept: string;
  status: 'Confirmed' | 'High_Risk' | 'Unconfirmed' | 'Recovered';
  riskProb: number;
  val: number;
  originalApp?: Appointment;
}

export const Architectural3DTimeline: React.FC<Architectural3DTimelineProps> = ({
  appointments,
  activeStage = 0,
  onSelectAppointment,
  isConfirmedLive = false,
  isRecoveredLive = false,
  focusedIndex,
}) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(2); // Default to 10:30 AM

  // 6 distinct chronological daylight appointments
  const timelineData: TileData[] = useMemo(() => {
    const defaultSlots = [
      { time: '09:30 AM', defaultName: 'Vikram Das', doctor: 'Dr. Verma', dept: 'General Medicine', status: 'Confirmed' as const, riskProb: 0.12, val: 2200 },
      { time: '10:00 AM', defaultName: 'Elena Rostova', doctor: 'Dr. Alvarez', dept: 'Neurology', status: 'Confirmed' as const, riskProb: 0.18, val: 3100 },
      { time: '10:30 AM', defaultName: 'Aarav Mehta', doctor: 'Dr. Sharma', dept: 'Cardiology', status: 'High_Risk' as const, riskProb: 0.87, val: 3500 },
      { time: '11:00 AM', defaultName: 'Meera Rao', doctor: 'Dr. Nair', dept: 'Pediatrics', status: 'Confirmed' as const, riskProb: 0.14, val: 1800 },
      { time: '11:30 AM', defaultName: 'Karan Joshi', doctor: 'Dr. Kapoor', dept: 'Orthopedics', status: 'Unconfirmed' as const, riskProb: 0.38, val: 2600 },
      { time: '12:00 PM', defaultName: 'Sunita Gill', doctor: 'Dr. Sharma', dept: 'Cardiology', status: 'Confirmed' as const, riskProb: 0.09, val: 2400 },
    ];

    if (appointments && appointments.length > 0) {
      const highRiskApp = appointments.find((a) => a.prediction?.risk_level === 'HIGH') || appointments[0];

      return defaultSlots.map((slot, i) => {
        if (i === 2 && highRiskApp) {
          return {
            time: '10:30 AM',
            patientName: `${highRiskApp.patient?.first_name || 'Aarav'} ${highRiskApp.patient?.last_name || 'Mehta'}`,
            doctor: highRiskApp.doctor_name || 'Dr. Sharma',
            dept: highRiskApp.department || 'Cardiology',
            status: (isRecoveredLive ? 'Recovered' : isConfirmedLive ? 'Confirmed' : 'High_Risk') as any,
            riskProb: highRiskApp.prediction?.risk_probability || 0.87,
            val: highRiskApp.estimated_slot_value || 3500,
            originalApp: highRiskApp,
          };
        }

        const candidateApp = appointments[i];
        if (candidateApp) {
          return {
            time: slot.time,
            patientName: `${candidateApp.patient?.first_name || slot.defaultName.split(' ')[0]} ${candidateApp.patient?.last_name || slot.defaultName.split(' ')[1]}`,
            doctor: candidateApp.doctor_name || slot.doctor,
            dept: candidateApp.department || slot.dept,
            status: (candidateApp.confirmation_status === 'Confirmed' ? 'Confirmed' : slot.status) as any,
            riskProb: candidateApp.prediction?.risk_probability || slot.riskProb,
            val: candidateApp.estimated_slot_value || slot.val,
            originalApp: candidateApp,
          };
        }

        return {
          time: slot.time,
          patientName: slot.defaultName,
          doctor: slot.doctor,
          dept: slot.dept,
          status: slot.status,
          riskProb: slot.riskProb,
          val: slot.val,
        };
      });
    }

    return defaultSlots.map((s, i) => ({
      time: s.time,
      patientName: s.defaultName,
      doctor: s.doctor,
      dept: s.dept,
      status: (i === 2 && isRecoveredLive ? 'Recovered' : i === 2 && isConfirmedLive ? 'Confirmed' : s.status) as any,
      riskProb: s.riskProb,
      val: s.val,
    }));
  }, [appointments, isConfirmedLive, isRecoveredLive]);

  const activeIndex = focusedIndex !== undefined && focusedIndex !== null ? focusedIndex : selectedSlotIndex;
  const activeTile = timelineData[activeIndex] || timelineData[2];

  return (
    <div className="w-full p-6 sm:p-10 space-y-8 bg-gradient-to-b from-white to-slate-50 text-slate-900 select-none">
      {/* 1. Sleek Time Rail Line with Precision Glowing Nodes */}
      <div className="relative pt-4 pb-2">
        {/* Continuous Track Line */}
        <div className="w-full h-1 bg-slate-200 rounded-full relative">
          <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-r from-slate-300 via-cyan-500 to-emerald-500 opacity-60 rounded-full" />
        </div>

        {/* Nodes along the timeline */}
        <div className="flex justify-between items-center -mt-2.5 px-2">
          {timelineData.map((tile, i) => {
            const isSelected = activeIndex === i;
            const isFocal = i === 2;
            return (
              <button
                key={i}
                onClick={() => {
                  setSelectedSlotIndex(i);
                  if (tile.originalApp) onSelectAppointment?.(tile.originalApp);
                }}
                className="group flex flex-col items-center gap-1.5 focus:outline-none"
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                    isSelected
                      ? 'bg-slate-900 border-slate-900 scale-125 shadow-md ring-4 ring-slate-100'
                      : isFocal
                      ? 'bg-rose-500 border-rose-600 animate-pulse'
                      : 'bg-white border-slate-300 group-hover:border-slate-500'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : isFocal ? 'bg-white' : 'bg-slate-400'
                    }`}
                  />
                </div>
                <span
                  className={`text-[11px] font-mono transition-colors ${
                    isSelected
                      ? 'font-bold text-slate-900'
                      : isFocal
                      ? 'font-bold text-rose-600'
                      : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                >
                  {tile.time}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Spacious Horizontal Clinical Cards Grid (Zero Overlap, Generous Gaps) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {timelineData.map((tile, i) => {
          const isSelected = activeIndex === i;
          const isFocal = i === 2;
          const isHighRisk = tile.status === 'High_Risk';
          const effectiveRecovered = isFocal && isRecoveredLive;
          const effectiveConfirmed = isFocal && isConfirmedLive;

          const badgeBg = effectiveRecovered
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : effectiveConfirmed
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : isHighRisk
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : tile.status === 'Confirmed'
            ? 'bg-slate-100 text-slate-700 border-slate-200'
            : 'bg-amber-50 text-amber-800 border-amber-200';

          const badgeText = effectiveRecovered
            ? 'RECOVERED'
            : effectiveConfirmed
            ? 'CONFIRMED'
            : isHighRisk
            ? `${Math.round(tile.riskProb * 100)}% RISK`
            : tile.status.toUpperCase();

          return (
            <motion.div
              key={tile.time + i}
              whileHover={{ y: -4 }}
              onClick={() => {
                setSelectedSlotIndex(i);
                if (tile.originalApp) onSelectAppointment?.(tile.originalApp);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[175px] ${
                isSelected
                  ? 'bg-white border-slate-900 shadow-xl ring-2 ring-slate-900/10'
                  : isHighRisk
                  ? 'bg-rose-50/40 border-rose-200 shadow-sm hover:border-rose-300'
                  : 'bg-white border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Header: Clock + Status Badge */}
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-600" />
                  {tile.time}
                </span>

                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shadow-xs ${badgeBg}`}>
                  {badgeText}
                </span>
              </div>

              {/* Patient & Doctor Details */}
              <div className="py-2 space-y-0.5">
                <h4 className="text-sm font-black text-slate-900 tracking-tight leading-snug truncate">
                  {effectiveRecovered ? 'Priya Kapoor' : tile.patientName}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  {tile.doctor}
                </p>
                <p className="text-[9px] text-slate-400 font-mono truncate">
                  {tile.dept}
                </p>
              </div>

              {/* Footer: Capacity Value */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Capacity</span>
                <span className="font-extrabold text-slate-900">₹{tile.val.toLocaleString('en-IN')}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Interactive Context Showcase Card (Expands cleanly below without squishing) */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-700 font-bold">
              ACTIVE SLOT INSPECTOR · {activeTile.time}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">
              {activeTile.patientName} · {activeTile.doctor} ({activeTile.dept})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500">
              Value Protected: <strong className="text-slate-900">₹{activeTile.val.toLocaleString('en-IN')}</strong>
            </span>
            <span
              className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                activeTile.status === 'High_Risk'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {activeTile.status === 'High_Risk' ? '87% Risk Detected' : 'Confirmed on File'}
            </span>
          </div>
        </div>

        {/* Dynamic Telemetry / Factors Breakdown */}
        {activeTile.status === 'High_Risk' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
              <span className="text-slate-400 block text-[10px] font-bold">PAST NO-SHOW RECORD</span>
              <span className="text-rose-600 font-extrabold text-sm block">2 Missed Visits</span>
              <span className="text-slate-500 text-[10px] block">+31% Risk Factor Attribution</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
              <span className="text-slate-400 block text-[10px] font-bold">BOOKING LEAD WINDOW</span>
              <span className="text-amber-700 font-extrabold text-sm block">4 Days Lead Time</span>
              <span className="text-slate-500 text-[10px] block">+22% Risk Factor Attribution</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
              <span className="text-slate-400 block text-[10px] font-bold">REMINDER ENGAGEMENT</span>
              <span className="text-amber-700 font-extrabold text-sm block">Unacknowledged</span>
              <span className="text-slate-500 text-[10px] block">+18% Risk Factor Attribution</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
              <span className="text-slate-400 block text-[10px] font-bold">TRANSIT DISTANCE</span>
              <span className="text-slate-800 font-extrabold text-sm block">14.5 km Away</span>
              <span className="text-slate-500 text-[10px] block">+11% Travel Friction</span>
            </div>
          </div>
        )}

        {/* Live Action Notification */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-500 pt-2">
          <span>
            {activeTile.status === 'High_Risk'
              ? '⚡ Slot flagged by ML Engine. Multi-channel proactive confirmation triggered.'
              : '✓ Attendance status confirmed. Clinical slot secure.'}
          </span>
          <span className="text-cyan-700 font-bold">
            CLICK ANY CARD TO INSPECT CLINICAL PARAMETERS →
          </span>
        </div>
      </div>
    </div>
  );
};
