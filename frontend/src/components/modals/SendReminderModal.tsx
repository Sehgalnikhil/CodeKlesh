import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  PhoneCall,
  Send,
  X,
  ArrowRight,
  ExternalLink,
  Copy,
  CheckCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  Smartphone,
  Zap,
  RotateCcw
} from 'lucide-react';
import { Appointment } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface SendReminderModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onReminderSent: (updatedAppointment?: Appointment) => void;
  onTriggerCall?: (appointment: Appointment) => void;
}

export const SendReminderModal: React.FC<SendReminderModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onReminderSent,
  onTriggerCall,
}) => {
  const { showToast } = useAuth();
  const [channel, setChannel] = useState<'WhatsApp' | 'SMS' | 'Phone Call'>('WhatsApp');
  const [scheduledFor, setScheduledFor] = useState('Immediate dispatch');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Editable recipient phone number
  const [recipientPhone, setRecipientPhone] = useState<string>('+917027635901');

  // Sync recipient phone from appointment when opened
  useEffect(() => {
    if (appointment?.patient?.phone && appointment.patient.phone.trim() !== '') {
      setRecipientPhone(appointment.patient.phone.trim());
    } else {
      setRecipientPhone('+917027635901');
    }
  }, [appointment, isOpen]);

  if (!isOpen || !appointment) return null;

  const patient = appointment.patient;
  const currentProb = Math.round((appointment.prediction?.risk_probability || 0.70) * 100);
  const impactProb = Math.round(
    (appointment.prediction?.estimated_impact_prob ||
      Math.max(0.12, (appointment.prediction?.risk_probability || 0.70) * 0.45)) * 100
  );

  const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');

  // WhatsApp message text
  const whatsappMessage =
`🏥 *SlotSure Clinic Appointment Confirmation*

Hello *${patient?.first_name || 'Patient'} ${patient?.last_name || ''}*, you have an upcoming consultation:

👨‍⚕️ *Doctor:* ${appointment.doctor_name} (${appointment.department})
📅 *Date:* ${appointment.appointment_date}
⏰ *Time:* ${appointment.appointment_time}
📍 *Location:* SlotSure Central Clinic

Reply *1* to *CONFIRM* or *2* to *RESCHEDULE*.
_SlotSure Healthcare Engine_`;

  const whatsappManualUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  // Carrier SMS text
  const smsMessage = `SlotSure Clinic: Hello ${patient?.first_name}, you have an appointment with ${appointment.doctor_name} on ${appointment.appointment_date} at ${appointment.appointment_time}. Reply 1 to Confirm or 2 to Cancel.`;

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    showToast('✓ Message copied to clipboard', 'info');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleResetPhone = () => {
    const orig = patient?.phone || '+917027635901';
    setRecipientPhone(orig);
    showToast(`Phone number reset to ${orig}`, 'info');
  };

  const handleSend = async () => {
    if (!recipientPhone.trim()) {
      showToast('Please enter a recipient phone number', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. WhatsApp Channel
      if (channel === 'WhatsApp') {
        const reminderRes = await api.dispatchReminder({
          appointment_id: appointment.id,
          patient_id: appointment.patient_id,
          channel: 'WhatsApp',
          scheduled_for: scheduledFor,
          phone: recipientPhone,
          notes: `WhatsApp reminder dispatched to ${recipientPhone}`,
        });

        if (reminderRes?.notes?.includes('Twilio WhatsApp')) {
          showToast(`✓ WhatsApp confirmation sent to ${recipientPhone}!`, 'success');
        } else if (reminderRes?.notes?.includes('Local WhatsApp')) {
          showToast(`✓ WhatsApp sent via local gateway to ${recipientPhone}!`, 'success');
        } else {
          window.open(whatsappManualUrl, '_blank');
          showToast(`✓ WhatsApp reminder logged and opened for ${recipientPhone}`, 'success');
        }

        onReminderSent();
        onClose();
        return;
      }

      // 2. Phone Call Channel
      if (channel === 'Phone Call') {
        if (onTriggerCall) {
          showToast(`✓ Launching AI Phone Call for ${recipientPhone}`, 'success');
          onReminderSent();
          onClose();
          const updatedAppointment: Appointment = {
            ...appointment,
            patient: appointment.patient
              ? { ...appointment.patient, phone: recipientPhone }
              : appointment.patient,
          };
          onTriggerCall(updatedAppointment);
          return;
        }
      }

      // 3. Carrier SMS Channel
      await api.dispatchReminder({
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        channel: 'SMS',
        scheduled_for: scheduledFor,
        phone: recipientPhone,
        notes: `Carrier SMS dispatched to ${recipientPhone}`,
      });

      showToast(`✓ SMS reminder dispatched to ${recipientPhone}`, 'success');
      onReminderSent();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch reminder', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPhoneEdited = patient?.phone && recipientPhone.trim() !== patient.phone.trim();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          className="bg-white dark:bg-[#181818] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.14)] max-w-lg w-full overflow-hidden flex flex-col"
        >
          {/* ===================== HEADER ===================== */}
          <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-[#FAFAFA] dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center shadow-2xs">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                  Send Clinical Reminder
                </h3>
                <p className="text-xs text-[#6B6B6F]">
                  {patient?.first_name} {patient?.last_name} · {appointment.appointment_time} · {appointment.doctor_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] hover:bg-black/[0.06] flex items-center justify-center text-[#6B6B6F] hover:text-[#1D1D1F] transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-3.5">
            {/* ================= RISK IMPACT STRIP ================= */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#F8F9FA] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl text-xs">
              <span className="text-[#6B6B6F] font-medium">Risk Reduction</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-600">{currentProb}%</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#86868B]" />
                <span className="font-bold text-emerald-600">{impactProb}%</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                  -{Math.max(1, currentProb - impactProb)}% Risk
                </span>
              </div>
            </div>

            {/* ================= EDITABLE PHONE INPUT ================= */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                  <span>Recipient Phone</span>
                </label>
                {isPhoneEdited && (
                  <button
                    type="button"
                    onClick={handleResetPhone}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="+91..."
                className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-zinc-800 border border-black/[0.12] dark:border-white/[0.1] rounded-xl text-[#1D1D1F] dark:text-white focus:outline-hidden focus:border-blue-500 shadow-2xs"
              />
            </div>

            {/* ================= CHANNEL SELECTOR ================= */}
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-white mb-1.5">
                Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* 1. WhatsApp */}
                <button
                  type="button"
                  onClick={() => setChannel('WhatsApp')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    channel === 'WhatsApp'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'border-black/[0.08] hover:bg-black/[0.02] text-[#6B6B6F] hover:text-[#1D1D1F] dark:border-white/[0.08]'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                {/* 2. SMS */}
                <button
                  type="button"
                  onClick={() => setChannel('SMS')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    channel === 'SMS'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs dark:bg-blue-950/30 dark:text-blue-400'
                      : 'border-black/[0.08] hover:bg-black/[0.02] text-[#6B6B6F] hover:text-[#1D1D1F] dark:border-white/[0.08]'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                  <span>Carrier SMS</span>
                </button>

                {/* 3. Phone Call */}
                <button
                  type="button"
                  onClick={() => setChannel('Phone Call')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    channel === 'Phone Call'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs dark:bg-indigo-950/30 dark:text-indigo-400'
                      : 'border-black/[0.08] hover:bg-black/[0.02] text-[#6B6B6F] hover:text-[#1D1D1F] dark:border-white/[0.08]'
                  }`}
                >
                  <PhoneCall className="h-3.5 w-3.5 text-indigo-600" />
                  <span>AI Call</span>
                </button>
              </div>
            </div>

            {/* ================= CHANNEL CONTENT ================= */}

            {/* WHATSAPP */}
            {channel === 'WhatsApp' && (
              <motion.div
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2.5"
              >
                {/* Gateway Pill */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-[11px]">
                  <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Twilio Cloud WhatsApp Active</span>
                    <span className="text-emerald-700 font-mono text-[10px]">(+1 737 250-8034)</span>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-200/60 dark:bg-emerald-900/50 px-1.5 py-0.2 rounded-md">
                    Meta Template
                  </span>
                </div>

                {/* Preview Box */}
                <div className="p-3 bg-emerald-50/30 dark:bg-white/[0.02] border border-emerald-200/70 dark:border-white/[0.08] rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Message Preview</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(whatsappMessage)}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      {hasCopied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{hasCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-zinc-900 border border-emerald-200/60 dark:border-white/[0.08] rounded-lg text-xs text-[#1D1D1F] dark:text-zinc-200 font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                    {whatsappMessage}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SMS */}
            {channel === 'SMS' && (
              <motion.div
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2.5"
              >
                <div className="p-3 bg-blue-50/40 dark:bg-white/[0.02] border border-blue-200/70 dark:border-white/[0.08] rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                      <span>Carrier SMS Preview</span>
                    </span>
                    <span className="text-[11px] text-[#6B6B6F] font-mono">
                      {smsMessage.length} chars
                    </span>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-zinc-900 border border-blue-200/60 dark:border-white/[0.08] rounded-lg text-xs text-[#1D1D1F] dark:text-zinc-200 font-mono leading-relaxed">
                    {smsMessage}
                  </div>
                </div>
              </motion.div>
            )}

            {/* PHONE CALL */}
            {channel === 'Phone Call' && (
              <motion.div
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2.5"
              >
                <div className="p-3.5 bg-indigo-50/50 dark:bg-white/[0.02] border border-indigo-200/70 dark:border-white/[0.08] rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <PhoneCall className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Conversational Voice Call</span>
                    </span>
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 px-1.5 py-0.2 rounded font-semibold">
                      Speech + Touchtone
                    </span>
                  </div>

                  <p className="text-xs text-indigo-950 dark:text-zinc-300 leading-relaxed">
                    Dials <strong className="font-mono">{recipientPhone}</strong> to deliver appointment details and record attendance directly.
                  </p>

                  {onTriggerCall && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        const updatedAppointment: Appointment = {
                          ...appointment,
                          patient: appointment.patient
                            ? { ...appointment.patient, phone: recipientPhone }
                            : appointment.patient,
                        };
                        onTriggerCall(updatedAppointment);
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Open Live AI Call Console ({recipientPhone})</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ================= SCHEDULE ================= */}
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-white mb-1">
                Schedule
              </label>
              <select
                value={scheduledFor}
                onChange={e => setScheduledFor(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-black/[0.12] dark:border-white/[0.1] rounded-xl text-[#1D1D1F] dark:text-white focus:outline-hidden focus:border-blue-500 shadow-2xs"
              >
                <option value="Immediate dispatch">Immediate Dispatch (Send Now)</option>
                <option value="24 hours before appointment">24 hours before appointment</option>
                <option value="48 hours before appointment">48 hours before appointment</option>
                <option value="Morning of appointment (7:00 AM)">Morning of appointment (7:00 AM)</option>
              </select>
            </div>
          </div>

          {/* ===================== FOOTER ===================== */}
          <div className="px-5 py-3.5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-[#FAFAFA] dark:bg-white/[0.02]">
            <div className="text-xs text-[#6B6B6F] flex items-center gap-1.5 font-mono">
              <Smartphone className="h-3.5 w-3.5 text-[#86868B]" />
              <span className="font-semibold text-[#1D1D1F] dark:text-white">{recipientPhone}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs font-semibold text-[#6B6B6F] hover:text-[#1D1D1F] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSend}
                disabled={isSubmitting}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                  channel === 'WhatsApp'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : channel === 'Phone Call'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>
                  {channel === 'WhatsApp'
                    ? 'Send on WhatsApp'
                    : channel === 'Phone Call'
                    ? 'Launch AI Call'
                    : 'Send SMS'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
