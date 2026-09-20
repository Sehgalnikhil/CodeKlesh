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
  QrCode,
  RefreshCw,
  Zap,
  Info,
  Edit3,
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

interface WhatsAppGatewayStatus {
  status: 'CONNECTED' | 'SCAN_QR' | 'DISCONNECTED' | 'INITIALIZING' | 'LOADING';
  phone: string | null;
  qr_image: string | null;
  has_qr?: boolean;
  qr_age_seconds?: number;
  is_expired?: boolean;
}

export const SendReminderModal: React.FC<SendReminderModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onReminderSent,
  onTriggerCall,
}) => {
  const { showToast } = useAuth();
  const [channel, setChannel] = useState<'SMS' | 'WhatsApp' | 'Phone Call'>('WhatsApp');
  const [scheduledFor, setScheduledFor] = useState('Immediate dispatch');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCopiedWa, setHasCopiedWa] = useState(false);
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);

  // Editable recipient phone number
  const [recipientPhone, setRecipientPhone] = useState<string>('+917027635901');

  // Local WhatsApp Gateway state
  const [gatewayStatus, setGatewayStatus] = useState<WhatsAppGatewayStatus>({
    status: 'LOADING',
    phone: null,
    qr_image: null,
  });

  // Sync recipient phone from appointment when opened
  useEffect(() => {
    if (appointment?.patient?.phone && appointment.patient.phone.trim() !== '') {
      setRecipientPhone(appointment.patient.phone.trim());
    } else {
      setRecipientPhone('+917027635901');
    }
  }, [appointment, isOpen]);

  // Poll WhatsApp Gateway status when WhatsApp tab is active
  useEffect(() => {
    if (!isOpen || channel !== 'WhatsApp') return;

    let isMounted = true;

    const checkStatus = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5005/status', { method: 'GET' });
        if (res.ok) {
          const data: WhatsAppGatewayStatus = await res.json();
          if (isMounted) setGatewayStatus(data);
        } else {
          if (isMounted) {
            setGatewayStatus({ status: 'DISCONNECTED', phone: null, qr_image: null });
          }
        }
      } catch {
        if (isMounted) {
          setGatewayStatus({ status: 'DISCONNECTED', phone: null, qr_image: null });
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, channel]);

  if (!isOpen || !appointment) return null;

  const patient = appointment.patient;
  const currentProb = Math.round((appointment.prediction?.risk_probability || 0.70) * 100);
  const impactProb = Math.round(
    (appointment.prediction?.estimated_impact_prob ||
      Math.max(0.12, (appointment.prediction?.risk_probability || 0.70) * 0.45)) * 100
  );

  // Clean phone number for WhatsApp link / gateway dispatch
  const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');

  // Formatted clinical WhatsApp confirmation text
  const whatsappMessage = 
`🏥 *SlotSure Clinic Appointment Confirmation*

Hello *${patient?.first_name || 'Patient'} ${patient?.last_name || ''}*, this is a clinical reminder for your upcoming appointment:

👨‍⚕️ *Doctor:* ${appointment.doctor_name} (${appointment.department})
📅 *Date:* ${appointment.appointment_date}
⏰ *Time:* ${appointment.appointment_time}
📍 *Location:* SlotSure Central Clinic

Please reply to this message:
1️⃣ Reply *1* to *CONFIRM* your appointment
2️⃣ Reply *2* to *RESCHEDULE* or *CANCEL*

_SlotSure Smart Healthcare Engine_`;

  const whatsappManualUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  // Formatted SMS text
  const smsMessage = `SlotSure Clinic: Hello ${patient?.first_name}, you have an appointment with ${appointment.doctor_name} on ${appointment.appointment_date} at ${appointment.appointment_time}. Reply 1 to Confirm or 2 to Cancel.`;

  const copyWhatsAppText = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setHasCopiedWa(true);
    showToast('✓ WhatsApp confirmation message copied', 'info');
    setTimeout(() => setHasCopiedWa(false), 2000);
  };

  const handleManualWhatsAppOpen = () => {
    if (!cleanPhone) {
      showToast('Please enter a valid recipient phone number', 'error');
      return;
    }
    window.open(whatsappManualUrl, '_blank');
    showToast(`✓ Opened WhatsApp for ${recipientPhone}`, 'info');
  };

  const handleRefreshQr = async () => {
    setIsRefreshingQr(true);
    try {
      await fetch('http://127.0.0.1:5005/refresh-qr', { method: 'POST' });
      showToast('Generating fresh WhatsApp QR code...', 'info');
    } catch {
      showToast('Gateway not responding. Make sure service is running.', 'error');
    } finally {
      setTimeout(() => setIsRefreshingQr(false), 1500);
    }
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
      // 1. WhatsApp Channel Handling
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
          showToast(`✓ Twilio WhatsApp Template sent directly to ${recipientPhone}!`, 'success');
        } else if (reminderRes?.notes?.includes('Local WhatsApp')) {
          showToast(`✓ Automated WhatsApp sent via local gateway to ${recipientPhone}!`, 'success');
        } else {
          window.open(whatsappManualUrl, '_blank');
          showToast(`✓ WhatsApp reminder logged and opened for ${recipientPhone}`, 'success');
        }

        onReminderSent();
        onClose();
        return;
      }


      // 2. Phone Call Channel Handling
      if (channel === 'Phone Call') {
        if (onTriggerCall) {
          showToast(`✓ Launching AI Phone Call for ${recipientPhone}`, 'success');
          onReminderSent();
          onClose();
          // Pass the appointment with the customized phone number
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

      // 3. SMS Channel Handling
      await api.dispatchReminder({
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        channel,
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
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          className="bg-white dark:bg-[#181818] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.14)] max-w-lg w-full overflow-hidden flex flex-col"
        >
          {/* ===================== HEADER ===================== */}
          <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-[#FAFAFA] dark:bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center shadow-2xs">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                  Send Clinical Reminder
                </h3>
                <p className="text-xs text-[#6B6B6F]">
                  {patient?.first_name} {patient?.last_name} · {appointment.appointment_time}
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

          <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
            {/* Impact Projection Card */}
            <div className="p-3.5 bg-[#F8F9FA] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#6B6B6F]">
                  Projected Risk Reduction
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                  ML Projection
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-rose-600">
                  {currentProb}%
                </span>
                <ArrowRight className="h-4 w-4 text-[#86868B]" />
                <span className="text-lg font-bold text-emerald-600">
                  {impactProb}%
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  -{Math.max(1, currentProb - impactProb)}% Risk
                </span>
              </div>
              <p className="text-[11px] text-[#6B6B6F] leading-relaxed">
                Direct patient notification to secure confirmation and minimize clinic no-show loss.
              </p>
            </div>

            {/* ================= EDITABLE PHONE NUMBER ================= */}
            <div className="p-3.5 bg-blue-50/40 dark:bg-blue-500/[0.04] border border-blue-200/70 dark:border-blue-500/20 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                  <span>Recipient Phone Number</span>
                </label>
                {isPhoneEdited && (
                  <button
                    type="button"
                    onClick={handleResetPhone}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset to default</span>
                  </button>
                )}
              </div>

              <div className="relative flex items-center">
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full text-xs font-mono font-medium px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-blue-300/80 dark:border-blue-500/30 rounded-xl text-[#1D1D1F] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs pr-20"
                />
                <div className="absolute right-2.5 flex items-center gap-1">
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                    <Edit3 className="h-2.5 w-2.5" />
                    <span>Editable</span>
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-[#6B6B6F] dark:text-zinc-400">
                You can change this number for WhatsApp, SMS, or Phone Call testing without changing patient records.
              </p>
            </div>

            {/* Channel Selection Buttons */}
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-white mb-2">
                Communication Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* 1. WhatsApp */}
                <button
                  type="button"
                  onClick={() => setChannel('WhatsApp')}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    channel === 'WhatsApp'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                      : 'border-black/[0.08] hover:bg-black/[0.02] text-[#6B6B6F] hover:text-[#1D1D1F]'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>WhatsApp</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">100% Free</span>
                </button>

                {/* 2. SMS */}
                <button
                  type="button"
                  onClick={() => setChannel('SMS')}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    channel === 'SMS'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                      : 'border-black/[0.08] hover:bg-black/[0.02] text-[#6B6B6F] hover:text-[#1D1D1F]'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>SMS</span>
                  <span className="text-[10px] text-[#86868B]">Twilio Carrier</span>
                </button>

                {/* 3. Phone Call */}
                <button
                  type="button"
                  onClick={() => setChannel('Phone Call')}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    channel === 'Phone Call'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                      : 'border-black/[0.08] hover:bg-black/[0.02] text-[#6B6B6F] hover:text-[#1D1D1F]'
                  }`}
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Phone Call</span>
                  <span className="text-[10px] text-indigo-600 font-medium">Interactive AI</span>
                </button>
              </div>
            </div>

            {/* ================= CHANNEL CONTENT PREVIEWS ================= */}

            {/* WHATSAPP CONTENT */}
            {channel === 'WhatsApp' && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Twilio WhatsApp Business Cloud Gateway (Active) */}
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-300/90 rounded-2xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <span>WhatsApp Cloud Gateway Active</span>
                        <span className="text-[10px] text-emerald-700 font-mono bg-emerald-100 px-1.5 py-0.2 rounded font-normal">
                          +1 (737) 250-8034
                        </span>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Auto
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Automated background delivery via official Meta Template (<code className="text-[10px] font-mono">HXfe5ab5...</code>). No QR scan or open browser tabs needed!
                  </p>
                </div>


                {/* Message Preview Box */}
                <div className="p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Message Preview</span>
                    </span>
                    <button
                      type="button"
                      onClick={copyWhatsAppText}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      {hasCopiedWa ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{hasCopiedWa ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-white border border-emerald-200/60 rounded-xl text-xs text-[#1D1D1F] font-mono whitespace-pre-wrap leading-relaxed shadow-2xs max-h-40 overflow-y-auto">
                    {whatsappMessage}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-emerald-800 pt-1">
                    <span>Sending to: <strong className="font-mono">{recipientPhone}</strong></span>
                    <span className="text-[10px] bg-emerald-100/60 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                      {gatewayStatus.status === 'CONNECTED' ? 'Background Auto-Send' : 'Direct Link'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SMS CONTENT */}
            {channel === 'SMS' && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span>Carrier SMS Preview</span>
                    </span>
                    <span className="text-[11px] text-[#6B6B6F] font-mono">
                      {smsMessage.length} chars
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-blue-200/60 rounded-xl text-xs text-[#1D1D1F] font-mono leading-relaxed shadow-2xs">
                    {smsMessage}
                  </div>

                  <div className="text-[11px] text-[#6B6B6F]">
                    Sending to: <strong className="text-[#1D1D1F] font-mono">{recipientPhone}</strong> via Twilio SMS Gateway.
                  </div>
                </div>
              </motion.div>
            )}

            {/* PHONE CALL CONTENT */}
            {channel === 'Phone Call' && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <PhoneCall className="h-4 w-4 text-indigo-600" />
                      <span>SlotSure Conversational AI Call</span>
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-semibold">
                      Speech + DTMF Sync
                    </span>
                  </div>

                  <p className="text-xs text-indigo-950 leading-relaxed">
                    Dials <strong className="font-mono">{recipientPhone}</strong> to speak clinical details, warn about past missed visits, and record patient confirmation or cancellation directly.
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
                      className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Open Live AI Call Console ({recipientPhone})</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Timing Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-white mb-1.5">
                Dispatch Schedule
              </label>
              <select
                value={scheduledFor}
                onChange={e => setScheduledFor(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-white dark:bg-zinc-800 border border-black/[0.12] dark:border-white/[0.1] rounded-xl text-[#1D1D1F] dark:text-white focus:outline-hidden focus:border-blue-500 shadow-2xs"
              >
                <option value="Immediate dispatch">Immediate Dispatch (Send Now)</option>
                <option value="24 hours before appointment">24 hours before appointment (Recommended)</option>
                <option value="48 hours before appointment">48 hours before appointment</option>
                <option value="Morning of appointment (7:00 AM)">Morning of appointment (7:00 AM)</option>
              </select>
            </div>
          </div>

          {/* ===================== FOOTER ===================== */}
          <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-[#FAFAFA] dark:bg-white/[0.02]">
            <div className="text-xs text-[#6B6B6F] flex items-center gap-1.5 font-mono">
              <Smartphone className="h-3.5 w-3.5 text-[#86868B]" />
              <span className="font-semibold text-[#1D1D1F] dark:text-white">{recipientPhone}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-2 text-xs font-semibold text-[#6B6B6F] hover:text-[#1D1D1F] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSend}
                disabled={isSubmitting}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                  channel === 'WhatsApp'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : channel === 'Phone Call'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : channel === 'WhatsApp' ? (
                  gatewayStatus.status === 'CONNECTED' ? (
                    <Send className="h-3.5 w-3.5" />
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5" />
                  )
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>
                  {channel === 'WhatsApp'
                    ? gatewayStatus.status === 'CONNECTED'
                      ? 'Send Automated WhatsApp'
                      : 'Send via WhatsApp'
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
