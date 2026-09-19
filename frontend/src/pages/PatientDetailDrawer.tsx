import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  Send,
  User,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  PhoneCall,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { Appointment } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { useAuth } from '../context/AuthContext';

interface PatientDetailDrawerProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSendReminder: (app: Appointment) => void;
  onNavigateToRecovery: () => void;
  onViewPatientDirectory: (patientId: number) => void;
  onRefreshData: () => void;
}

export const PatientDetailDrawer: React.FC<PatientDetailDrawerProps> = ({
  appointment,
  isOpen,
  onClose,
  onOpenSendReminder,
  onNavigateToRecovery,
  onViewPatientDirectory,
  onRefreshData,
}) => {
  const { showToast } = useAuth();
  const [callScheduled, setCallScheduled] = useState(false);

  if (!isOpen || !appointment) return null;

  const patient = appointment.patient;
  const prediction = appointment.prediction;

  const prob = Math.round((prediction?.risk_probability || 0.87) * 100);
  const impactProb = Math.round((prediction?.estimated_impact_prob || 0.68) * 100);
  const riskLevel = prediction?.risk_level || 'HIGH';
  const isHigh = riskLevel === 'HIGH';
  const isUnconfirmed = appointment.confirmation_status !== 'Confirmed';

  const factors = prediction?.top_factors || [
    { factor: 'previous_no_shows', label: 'Previous missed appointments', impact_direction: 'positive', contribution: 0.31, percentage: 31 },
    { factor: 'booking_gap', label: 'Long booking gap (17d)', impact_direction: 'positive', contribution: 0.22, percentage: 22 },
    { factor: 'reminder_history', label: 'No response to SMS', impact_direction: 'positive', contribution: 0.18, percentage: 18 },
    { factor: 'appointment_time', label: 'Appointment timing', impact_direction: 'positive', contribution: 0.11, percentage: 11 },
  ];

  const handleScheduleCall = () => {
    setCallScheduled(true);
    showToast(`✓ Clinical outreach call queued for ${patient?.first_name} ${patient?.last_name}`, 'success');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Soft atmospheric backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity"
        />

        {/* Large Floating Apple Sheet */}
        <motion.div
          initial={{ x: '100%', opacity: 0.8, scale: 0.98 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: '100%', opacity: 0.8, scale: 0.98 }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          className="relative w-full max-w-lg m-3 rounded-[32px] bg-white/95 dark:bg-[#161618]/95 backdrop-blur-3xl border border-white/80 dark:border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.3)] flex flex-col justify-between overflow-hidden z-10"
        >
          {/* Sheet Top Bar */}
          <div className="p-6 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]">
                Patient Intelligence
              </span>
              <h2 className="text-xl font-extrabold text-[#1D1D1F] dark:text-white mt-0.5">
                {patient?.first_name} {patient?.last_name}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#6E6E73]">
                <span className="font-mono bg-black/[0.04] dark:bg-white/[0.08] px-2 py-0.5 rounded-md text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold">
                  {patient?.patient_code}
                </span>
                <span>·</span>
                <span>Age: {patient?.age}</span>
                <span>·</span>
                <span>{patient?.gender}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Sheet Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Patient Profile Statistics - Apple Health Format */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73] block">Attendance</span>
                <span className="text-2xl font-extrabold text-[#1D1D1F] dark:text-white mt-1 block">82%</span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Good Baseline</span>
              </div>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73] block">Appointments</span>
                <span className="text-2xl font-extrabold text-[#1D1D1F] dark:text-white mt-1 block">17</span>
                <span className="text-[10px] text-[#6E6E73] font-semibold mt-0.5 block">Lifetime Visits</span>
              </div>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73] block">No-Shows</span>
                <span className="text-2xl font-extrabold text-rose-600 mt-1 block">3</span>
                <span className="text-[10px] text-rose-500 font-semibold mt-0.5 block">Past Misses</span>
              </div>
            </div>

            {/* AI Behavior Summary Pills */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73] block">
                AI Behavioral Patterns
              </span>
              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                  <span>"Usually confirms within 6 hours."</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span>"Morning appointments show higher risk."</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>"Responds 3x faster to WhatsApp reminders than phone calls."</span>
                </div>
              </div>
            </div>

            {/* Current Visit Assessment Card */}
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Current Visit Vulnerability
                </span>
                <RiskBadge level={riskLevel} size="sm" />
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-3xl font-extrabold text-rose-600 tracking-tight">
                    {prob}% Risk
                  </div>
                  <p className="text-xs text-[#6E6E73] mt-0.5">
                    Tomorrow · {appointment.appointment_time} · {appointment.doctor_name}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73] block">Status</span>
                  <span className="text-xs font-bold text-rose-600">
                    {appointment.confirmation_status || 'Not confirmed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Explainable AI Factor Weights */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73] block">
                Why this appointment is at risk
              </span>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-3 text-xs">
                {factors.map((f, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-zinc-700 dark:text-zinc-300">{f.label}</span>
                      <span className="font-bold text-rose-600">+{Math.abs(f.percentage)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-500"
                        style={{ width: `${Math.min(100, Math.abs(f.percentage) * 2.5)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendation Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-500/10 via-indigo-500/10 to-transparent border border-brand-500/20 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Recommended Action</span>
              </div>
              <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                Dispatch personalized SMS + WhatsApp reminder
              </h4>
              <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-brand-500/20 flex items-center justify-between text-xs">
                <span className="text-[#6E6E73]">Projected risk reduction:</span>
                <span className="font-bold text-emerald-600">{prob}% → {impactProb}% (-19%)</span>
              </div>
            </div>
          </div>

          {/* Sheet Footer Controls */}
          <div className="p-5 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between gap-3">
            <button
              onClick={() => onOpenSendReminder(appointment)}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-full text-xs font-bold shadow-[0_2px_12px_rgba(79,70,229,0.35)] active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send Reminder</span>
            </button>

            <button
              onClick={onNavigateToRecovery}
              className="py-2.5 px-4 border border-rose-500/20 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold active:scale-95 transition-all"
            >
              Slot Recovery
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
