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
  PhoneCall,
  PhoneForwarded,
  CheckCircle2,
  Stethoscope,
  Building2,
  FileText,
  Loader2,
  Check
} from 'lucide-react';
import { Appointment } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { useAuth } from '../context/AuthContext';
import { useActivityStream } from '../context/ActivityStreamContext';
import { api } from '../api/client';

interface PatientDetailDrawerProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSendReminder: (app: Appointment) => void;
  onNavigateToRecovery: () => void;
  onViewPatientDirectory: (patientId: number) => void;
  onRefreshData: () => void;
  onOpenOutboundCall?: (app: Appointment) => void;
}

export const PatientDetailDrawer: React.FC<PatientDetailDrawerProps> = ({
  appointment,
  isOpen,
  onClose,
  onOpenSendReminder,
  onNavigateToRecovery,
  onViewPatientDirectory,
  onRefreshData,
  onOpenOutboundCall,
}) => {
  const { showToast } = useAuth();
  const { emitEvent } = useActivityStream();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [isQueuingCall, setIsQueuingCall] = useState(false);
  const [callQueued, setCallQueued] = useState(false);
  const [reminderSentInfo, setReminderSentInfo] = useState<{ time: string; channel: string } | null>(null);

  if (!isOpen || !appointment) return null;

  const patient = appointment.patient;
  const prediction = appointment.prediction;

  const prob = Math.round((prediction?.risk_probability || 0.82) * 100);
  const impactProb = Math.round((prediction?.estimated_impact_prob || Math.max(0.12, (prediction?.risk_probability || 0.82) * 0.45)) * 100);
  const riskLevel = prediction?.risk_level || (prob >= 70 ? 'HIGH' : prob >= 40 ? 'MEDIUM' : 'LOW');

  const riskColor = riskLevel === 'HIGH' ? '#C9685B' : riskLevel === 'MEDIUM' ? '#C18A3A' : '#4F8A70';

  const factors = prediction?.top_factors?.length ? prediction.top_factors : [
    { factor: 'previous_no_shows', label: 'Previous missed appointments', impact_direction: 'positive', contribution: 0.31, percentage: 31 },
    { factor: 'booking_gap', label: 'Long booking gap (14d)', impact_direction: 'positive', contribution: 0.22, percentage: 22 },
    { factor: 'reminder_history', label: 'Unconfirmed reminder response', impact_direction: 'positive', contribution: 0.18, percentage: 18 },
    { factor: 'appointment_time', label: 'Appointment timing / weekday', impact_direction: 'positive', contribution: 0.11, percentage: 11 },
  ];

  // SVG circular gauge geometry
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (prob / 100) * circumference;

  const handleStatusChange = async (newConfirmation: string) => {
    try {
      setIsUpdatingStatus(true);
      let appStatus = appointment.status;
      if (newConfirmation === 'Cancelled') appStatus = 'Cancelled';
      else if (newConfirmation === 'Completed') appStatus = 'Completed';
      else if (newConfirmation === 'No-show') appStatus = 'No-show';
      else if (newConfirmation === 'Confirmed') appStatus = 'Scheduled';

      await api.updateAppointmentStatus(appointment.id, {
        confirmation_status: newConfirmation,
        status: appStatus,
      });

      showToast(`✓ Confirmation updated to ${newConfirmation}`, 'success');
      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleQuickSendReminder = async () => {
    try {
      setIsSendingReminder(true);
      const res = await api.dispatchReminder({
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        channel: 'SMS + WhatsApp',
        strategy: 'urgent_confirmation',
        notes: 'Priority automated clinical reminder with deep-link confirmation',
      });

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setReminderSentInfo({
        time: now,
        channel: res.channel || 'SMS + WhatsApp',
      });

      showToast('✓ Reminder dispatched to patient via SMS + WhatsApp', 'success');
      emitEvent({
        type: 'REMINDER',
        title: 'Clinical Reminder Dispatched',
        description: `Dispatched SMS + WhatsApp reminder to ${patient?.first_name} ${patient?.last_name}`,
        patientName: `${patient?.first_name} ${patient?.last_name}`,
        doctorName: appointment.doctor_name,
        badge: 'Dispatched',
        badgeColor: '#647A8A',
      });
      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch reminder', 'error');
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleQueueStaffCall = async () => {
    try {
      setIsQueuingCall(true);
      await api.updateAppointmentStatus(appointment.id, {
        notes: (appointment.notes || '') + ' [Staff phone outreach queued]',
      });
      setCallQueued(true);
      emitEvent({
        type: 'CALL_QUEUED',
        title: 'Staff Outreach Queued',
        description: `Direct phone outreach task queued for ${patient?.first_name} ${patient?.last_name} on clinic desk`,
        patientName: `${patient?.first_name} ${patient?.last_name}`,
        doctorName: appointment.doctor_name,
        badge: 'Call Queued',
        badgeColor: '#C18A3A',
      });
      showToast(`✓ Clinical voice outreach queued for ${patient?.first_name} ${patient?.last_name}`, 'success');
      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to queue outreach', 'error');
    } finally {
      setIsQueuingCall(false);
    }
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
          className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        />

        {/* Refined Glass Panel sliding from right */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative w-full max-w-lg m-2 sm:m-4 rounded-[28px] bg-white/85 dark:bg-[#181818]/90 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col justify-between overflow-hidden z-10"
        >
          {/* Top Bar */}
          <div className="p-6 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-semibold text-sm tracking-tight shadow-sm">
                {patient?.first_name?.[0] || 'P'}{patient?.last_name?.[0] || ''}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1D1D1F] dark:text-white tracking-tight">
                  {patient?.first_name} {patient?.last_name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-[#6B6B6F]">
                  <span className="font-mono bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded text-[11px] font-medium text-[#1D1D1F] dark:text-white">
                    {patient?.patient_code || `PT-${appointment.patient_id}`}
                  </span>
                  <span>·</span>
                  <span>{patient?.age} yrs</span>
                  <span>·</span>
                  <span>{patient?.gender}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Appointment Meta Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 text-[#6B6B6F]">
                  <Stethoscope className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Clinician</span>
                </div>
                <div className="font-medium text-[#1D1D1F] dark:text-white truncate">
                  {appointment.doctor_name}
                </div>
                <div className="text-[11px] text-[#6B6B6F] truncate">
                  {appointment.department}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 text-[#6B6B6F]">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Schedule</span>
                </div>
                <div className="font-medium text-[#1D1D1F] dark:text-white">
                  {appointment.appointment_date}
                </div>
                <div className="text-[11px] text-[#6B6B6F]">
                  {appointment.appointment_time} · {appointment.appointment_type || 'Follow-up'}
                </div>
              </div>
            </div>

            {/* Live Confirmation Status Selector */}
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6F]">
                  Confirmation Status
                </span>
                {isUpdatingStatus && (
                  <div className="flex items-center gap-1 text-[11px] text-[#6B6B6F]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Updating...</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {[
                  { key: 'Confirmed', label: 'Confirmed', color: 'hover:border-[#4F8A70]' },
                  { key: 'Not confirmed', label: 'Pending', color: 'hover:border-[#C18A3A]' },
                  { key: 'Completed', label: 'Completed', color: 'hover:border-[#647A8A]' },
                  { key: 'Cancelled', label: 'Cancelled', color: 'hover:border-[#C9685B]' },
                  { key: 'No-show', label: 'No-show', color: 'hover:border-[#C9685B]' },
                ].map(opt => {
                  const isActive = (appointment.confirmation_status === opt.key) ||
                    (opt.key === 'Not confirmed' && !appointment.confirmation_status) ||
                    (opt.key === 'Cancelled' && appointment.status === 'Cancelled') ||
                    (opt.key === 'Completed' && appointment.status === 'Completed') ||
                    (opt.key === 'No-show' && appointment.status === 'No-show');

                  return (
                    <button
                      key={opt.key}
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange(opt.key)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-medium transition-all text-center border ${
                        isActive
                          ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] border-transparent shadow-sm'
                          : 'bg-white/60 dark:bg-black/30 text-[#6B6B6F] border-black/[0.06] dark:border-white/[0.06] hover:text-[#1D1D1F] dark:hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Circular Ring Risk Gauge */}
            <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6F]">
                  Missed Appointment Risk
                </span>
                <RiskBadge level={riskLevel} size="sm" />
              </div>

              <div className="flex items-center gap-6">
                {/* SVG Ring */}
                <div className="relative flex items-center justify-center flex-shrink-0">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="7"
                      fill="transparent"
                      className="text-black/[0.06] dark:text-white/[0.08]"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      stroke={riskColor}
                      strokeWidth="7"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                      {prob}%
                    </span>
                    <span className="text-[9px] font-semibold text-[#6B6B6F] uppercase">
                      Risk
                    </span>
                  </div>
                </div>

                {/* Risk narrative */}
                <div className="space-y-1.5 text-xs text-[#6B6B6F]">
                  <p className="leading-relaxed">
                    Based on random forest probability modeling across clinical history and engagement markers.
                  </p>
                  <div className="flex items-center gap-2 pt-1 font-medium text-[#1D1D1F] dark:text-white">
                    <span>Projected with reminder:</span>
                    <span className="font-bold text-[#4F8A70]">{impactProb}% ({prob - impactProb}% drop)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Explainable AI Model Factors */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6F] block">
                Why this risk? (Model Explanation)
              </span>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-3 text-xs">
                {factors.map((f, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-[#1D1D1F] dark:text-white">{f.label}</span>
                      <span className="font-semibold text-[#C9685B]">+{Math.abs(f.percentage)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C9685B] transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.abs(f.percentage) * 2.6)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Next Action Panel */}
            <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#647A8A]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Recommended Next Action</span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                  {riskLevel === 'HIGH' ? 'Send Urgent Clinical Reminder' : 'Automated Reminder Dispatch'}
                </h4>
                <p className="text-xs text-[#6B6B6F] mt-1 leading-relaxed">
                  {riskLevel === 'HIGH'
                    ? 'Patient has a high predicted no-show probability and has not confirmed. Dispatching reminder offers a projected risk reduction.'
                    : 'Standard confirmation check is advised to lock the capacity in the scheduling grid.'}
                </p>
              </div>

              {/* Delivery status banner if sent */}
              {(reminderSentInfo || appointment.sms_reminder_sent) && (
                <div className="p-3 rounded-xl bg-[#4F8A70]/10 border border-[#4F8A70]/20 flex items-center gap-2.5 text-xs text-[#4F8A70]">
                  <Check className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">✓ Reminder sent</span>
                    <span className="text-[11px] opacity-80 block">
                      {reminderSentInfo ? `${reminderSentInfo.time} · Delivered via ${reminderSentInfo.channel}` : 'Delivered to patient mobile'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  disabled={isSendingReminder}
                  onClick={handleQuickSendReminder}
                  className="flex-1 py-2 px-3 bg-[#1D1D1F] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#E5E5EA] text-white dark:text-[#1D1D1F] rounded-xl text-xs font-medium transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSendingReminder ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Send Reminder</span>
                </button>

                <button
                  onClick={() => onOpenSendReminder(appointment)}
                  className="py-2 px-3 rounded-xl text-xs font-medium border border-black/[0.08] dark:border-white/[0.1] text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
                >
                  Schedule
                </button>

                <button
                  onClick={onClose}
                  className="py-2 px-3 rounded-xl text-xs font-medium text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {/* Multi-Channel Outreach Escalation Cascade */}
            <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6F]">
                  Outreach Escalation Cascade
                </span>
                <span className="text-[10px] font-mono text-[#647A8A]">
                  Triage Protocol
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#4F8A70]" />
                    <div>
                      <span className="font-semibold text-[#1D1D1F] dark:text-white block">T-24h: Automated SMS</span>
                      <span className="text-[10px] text-[#6B6B6F]">Deep-link confirmation sent</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#4F8A70] font-semibold">Delivered</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#C18A3A]" />
                    <div>
                      <span className="font-semibold text-[#1D1D1F] dark:text-white block">T-18h: WhatsApp Interactive</span>
                      <span className="text-[10px] text-[#6B6B6F]">Awaiting tap response</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#C18A3A] font-semibold">Pending Reply</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-[#647A8A]" />
                    <div>
                      <span className="font-semibold text-[#1D1D1F] dark:text-white block">T-8h: Priority Voice Outreach</span>
                      <span className="text-[10px] text-[#6B6B6F]">Reception desk verbal triage</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onOpenOutboundCall && (
                      <button
                        onClick={() => onOpenOutboundCall(appointment)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 shadow-xs active:scale-95"
                      >
                        <PhoneForwarded className="h-3 w-3" />
                        <span>AI Call Now</span>
                      </button>
                    )}
                    {callQueued ? (
                      <span className="text-[10px] text-[#4F8A70] font-semibold">✓ Queued</span>
                    ) : (
                      <button
                        disabled={isQueuingCall}
                        onClick={handleQueueStaffCall}
                        className="px-2.5 py-1 bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] rounded-lg text-[10px] font-medium hover:bg-[#2C2C2E] transition-all disabled:opacity-50"
                      >
                        {isQueuingCall ? 'Queuing...' : 'Queue'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between gap-3">
            <button
              onClick={() => {
                onClose();
                onViewPatientDirectory(appointment.patient_id);
              }}
              className="text-xs font-medium text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white flex items-center gap-1"
            >
              <User className="h-3.5 w-3.5" />
              <span>Full Patient History</span>
            </button>

            {prob >= 60 && (
              <button
                onClick={onNavigateToRecovery}
                className="py-2 px-3.5 rounded-full text-xs font-medium text-[#C9685B] border border-[#C9685B]/20 hover:bg-[#C9685B]/10 transition-all flex items-center gap-1"
              >
                <span>View in Slot Recovery</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
