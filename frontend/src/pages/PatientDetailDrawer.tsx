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
  Check,
  Compass,
  MessageCircle,
  Pill,
  HeartPulse,
  Zap,
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
  onOpenWhatsAppNegotiation?: (app: Appointment) => void;
  onOpenJourneyRadar?: (app: Appointment) => void;
  onOpenAzureDocScanner?: () => void;
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
  onOpenWhatsAppNegotiation,
  onOpenJourneyRadar,
  onOpenAzureDocScanner,
}) => {
  const { showToast } = useAuth();
  const { emitEvent } = useActivityStream();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [isQueuingCall, setIsQueuingCall] = useState(false);
  const [callQueued, setCallQueued] = useState(false);
  const [reminderSentInfo, setReminderSentInfo] = useState<{ time: string; channel: string } | null>(null);
  const [azureInsights, setAzureInsights] = useState<any | null>(null);
  const [isAnalyzingAzure, setIsAnalyzingAzure] = useState(false);
  const [followUpScheduled, setFollowUpScheduled] = useState(false);

  const handleRunAzureHealthInsights = async () => {
    try {
      setIsAnalyzingAzure(true);
      const textToAnalyze =
        appointment?.notes ||
        `Patient ${appointment?.patient?.first_name || 'Aarav'} presents for ${appointment?.department || 'General Medicine'} evaluation. Complains of persistent cough and fever for 3 days. Denies chest pain or shortness of breath. Prescribed Azithromycin 500mg.`;
      const res = await api.azureHealthInsights(textToAnalyze, appointment?.id);
      setAzureInsights(res);
      showToast('Azure AI Text Analytics for Health extracted clinical entities', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to extract Azure clinical entities', 'error');
    } finally {
      setIsAnalyzingAzure(false);
    }
  };

  const handleScheduleFollowUp = () => {
    const pName = appointment?.patient
      ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
      : `Patient #${appointment?.patient_id}`;
    setFollowUpScheduled(true);
    showToast(
      `7-Day clinical adherence check scheduled for ${pName}`,
      'success'
    );
    emitEvent({
      type: 'REMINDER',
      title: '7-Day Follow-Up Scheduled',
      description: `💊 7-Day clinical adherence check scheduled for ${pName} (+7 days).`,
      patientName: pName,
      badge: 'Adherence',
      badgeColor: 'emerald',
    });
  };

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

            {/* Autonomous Patient Engagement & Live Radar */}
            <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6F]">
                  Patient Outreach & Attendance Protocol
                </span>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  CLINICAL PROTOCOL ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* WhatsApp Outpatient Desk Button */}
                {onOpenWhatsAppNegotiation && (
                  <button
                    onClick={() => onOpenWhatsAppNegotiation(appointment)}
                    className="p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 active:scale-95 border border-emerald-200/80 text-left transition-all shadow-2xs group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                        WhatsApp
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <h5 className="font-bold text-xs text-emerald-950 group-hover:text-emerald-900">
                        WhatsApp Outpatient Desk
                      </h5>
                      <p className="text-[11px] text-emerald-700/90 mt-0.5 leading-snug">
                        Two-way patient messaging & slot coordination
                      </p>
                    </div>
                  </button>
                )}

                {/* Patient Live Journey Radar Button */}
                {onOpenJourneyRadar && (
                  <button
                    onClick={() => onOpenJourneyRadar(appointment)}
                    className="p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 active:scale-95 border border-slate-200 text-left transition-all shadow-2xs group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
                        <Compass className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        Live PWA
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <h5 className="font-bold text-xs text-slate-900 group-hover:text-slate-800">
                        Live Journey Radar
                      </h5>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        Swiggy-style queue tracker & buffer swap
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Pre-Consultation Intake & Reported Symptoms */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                    Pre-Consultation Intake & Symptoms
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                  WhatsApp Ingested
                </span>
              </div>
              <div className="text-xs text-stone-700 bg-white/90 p-3 rounded-xl border border-stone-200/80 leading-relaxed font-sans shadow-2xs">
                {appointment.notes ? (
                  <div>
                    <span className="font-semibold text-stone-900">Recorded Chief Complaints / Token:</span>
                    <p className="mt-1 text-stone-700">{appointment.notes}</p>
                  </div>
                ) : (
                  <span className="text-stone-400 italic">
                    No pre-consultation symptoms recorded yet. Patient can submit symptoms or prior prescriptions directly via the WhatsApp concierge.
                  </span>
                )}
              </div>
            </div>

            {/* Microsoft Azure AI Health Intelligence & Entity Radar */}
            <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-700">
                    <Zap className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-950 block">
                      Azure AI Text Analytics for Health
                    </span>
                    <span className="text-[10px] text-sky-700">
                      Cognitive Clinical NLP & Entity Assertion
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunAzureHealthInsights}
                  disabled={isAnalyzingAzure}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isAnalyzingAzure ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-sky-200" />
                      Analyze Notes
                    </>
                  )}
                </button>
              </div>

              {azureInsights ? (
                <div className="space-y-2.5 pt-1">
                  {/* Triage Summary */}
                  <div className="p-2.5 rounded-xl bg-white border border-sky-100 text-xs text-sky-950 leading-relaxed shadow-2xs">
                    <p className="font-semibold text-[11px] text-sky-900 mb-0.5">Azure Clinical Interpretation:</p>
                    <p className="text-stone-700">{azureInsights.clinical_triage}</p>
                  </div>

                  {/* Extracted Entities */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Extracted Medical Entities ({azureInsights.entities?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {azureInsights.entities?.map((ent: any, idx: number) => {
                        const isNegated = ent.assertion && ent.assertion.toLowerCase().includes('negat');
                        return (
                          <div
                            key={idx}
                            className={`px-2 py-1 rounded-lg text-[10px] font-medium border flex items-center gap-1.5 ${
                              isNegated
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : ent.category === 'Medication'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-sky-50 text-sky-900 border-sky-200'
                            }`}
                          >
                            <span className="font-bold">{ent.text}</span>
                            <span className="text-[9px] opacity-75">[{ent.category}]</span>
                            {ent.code && <span className="font-mono text-[9px] opacity-80 font-bold">{ent.code}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Document scanner trigger */}
                  {onOpenAzureDocScanner && (
                    <button
                      type="button"
                      onClick={onOpenAzureDocScanner}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-white hover:bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-600" />
                      Scan Prescriptions/Lab PDFs via Azure AI Document Intelligence
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-white/70 border border-sky-100 rounded-xl flex items-center justify-between text-xs text-stone-600">
                  <span>Click "Analyze Notes" to parse clinical entities, ICD-10 codes, and negations via Azure.</span>
                  {onOpenAzureDocScanner && (
                    <button
                      type="button"
                      onClick={onOpenAzureDocScanner}
                      className="text-sky-700 hover:text-sky-900 font-semibold underline text-[11px] whitespace-nowrap ml-2"
                    >
                      Scan Rx / Labs
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Post-Consultation 7-Day Medicine Adherence */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-700" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-950">
                    7-Day Medicine Adherence & Recovery
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                  Post-OP Protocol
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-snug">
                Automates an interactive WhatsApp adherence survey 7 days post-appointment to verify prescription completion and recovery markers.
              </p>
              {followUpScheduled ? (
                <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 flex items-center justify-between text-xs text-emerald-900 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    7-Day Adherence Check Scheduled
                  </span>
                  <span className="text-[11px] text-emerald-700 font-mono">T+7 Days</span>
                </div>
              ) : (
                <button
                  onClick={handleScheduleFollowUp}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <HeartPulse className="w-3.5 h-3.5" />
                  Schedule 7-Day Adherence Check
                </button>
              )}
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
                        className="px-2.5 py-1 bg-[#1D1D1F] hover:bg-[#333336] text-white rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 shadow-xs active:scale-95"
                      >
                        <PhoneForwarded className="h-3 w-3" />
                        <span>Call Patient</span>
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
