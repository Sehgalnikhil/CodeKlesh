import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Phone, Send, X, ArrowRight, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { Appointment } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface SendReminderModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onReminderSent: (updatedAppointment?: Appointment) => void;
}

export const SendReminderModal: React.FC<SendReminderModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onReminderSent,
}) => {
  const { showToast } = useAuth();
  const [channel, setChannel] = useState<'SMS' | 'WhatsApp' | 'Phone Call'>('SMS');
  const [scheduledFor, setScheduledFor] = useState('24 hours before appointment');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !appointment) return null;

  const currentProb = Math.round((appointment.prediction?.risk_probability || 0.82) * 100);
  const impactProb = Math.round((appointment.prediction?.estimated_impact_prob || Math.max(0.12, (appointment.prediction?.risk_probability || 0.82) * 0.45)) * 100);

  const handleSend = async () => {
    setIsSubmitting(true);
    try {
      await api.dispatchReminder({
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        channel,
        scheduled_for: scheduledFor,
        notes: `Clinical intervention dispatched via ${channel} to ${appointment.patient?.first_name} ${appointment.patient?.last_name}`,
      });

      showToast(`✓ Reminder dispatched: ${channel} sent to ${appointment.patient?.phone}`, 'success');
      onReminderSent();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch reminder', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 26, stiffness: 350 }}
          className="bg-white/95 dark:bg-[#181818]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-white flex items-center justify-center">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                  Send Clinical Reminder
                </h3>
                <p className="text-xs text-[#6B6B6F]">
                  Patient: {appointment.patient?.first_name} {appointment.patient?.last_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Impact Projection Card */}
            <div className="p-3.5 bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#6B6B6F]">
                  Estimated Risk Reduction
                </span>
                <span className="text-[10px] font-semibold text-[#4F8A70] bg-[#4F8A70]/10 px-2 py-0.5 rounded-full">
                  Model Projection
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-semibold text-[#C9685B]">
                  {currentProb}%
                </span>
                <ArrowRight className="h-4 w-4 text-[#6B6B6F]" />
                <span className="text-xl font-semibold text-[#4F8A70]">
                  {impactProb}%
                </span>
                <span className="text-xs font-semibold text-[#4F8A70] bg-[#4F8A70]/10 px-2 py-0.5 rounded">
                  -{currentProb - impactProb}% Risk
                </span>
              </div>
              <p className="text-[11px] text-[#6B6B6F]">
                Automated 2-way confirmation message with quick confirmation link.
              </p>
            </div>

            {/* Channel Selection */}
            <div>
              <label className="block text-xs font-medium text-[#1D1D1F] dark:text-white mb-1.5">
                Communication Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['SMS', 'WhatsApp', 'Phone Call'] as const).map(ch => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                      channel === ch
                        ? 'border-[#1D1D1F] dark:border-white bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] shadow-sm'
                        : 'border-black/[0.06] dark:border-white/[0.08] text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white'
                    }`}
                  >
                    {ch === 'SMS' && <MessageSquare className="h-4 w-4" />}
                    {ch === 'WhatsApp' && <CheckCircle2 className="h-4 w-4" />}
                    {ch === 'Phone Call' && <Phone className="h-4 w-4" />}
                    <span>{ch}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Timing Selection */}
            <div>
              <label className="block text-xs font-medium text-[#1D1D1F] dark:text-white mb-1.5">
                Dispatch Schedule
              </label>
              <select
                value={scheduledFor}
                onChange={e => setScheduledFor(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-[#1D1D1F] dark:text-white focus:outline-none"
              >
                <option value="24 hours before appointment">24 hours before appointment (Recommended)</option>
                <option value="48 hours before appointment">48 hours before appointment</option>
                <option value="Immediate dispatch">Send Immediately</option>
                <option value="Morning of appointment (7:00 AM)">Morning of appointment (7:00 AM)</option>
              </select>
            </div>

            {/* Phone Confirmation */}
            <div className="p-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl text-xs text-[#6B6B6F]">
              <span className="font-semibold text-[#1D1D1F] dark:text-white">Recipient: </span>
              {appointment.patient?.phone} ({appointment.patient?.first_name} {appointment.patient?.last_name})
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-medium text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-medium text-white dark:text-[#1D1D1F] bg-[#1D1D1F] dark:bg-white hover:bg-[#2C2C2E] dark:hover:bg-[#E5E5EA] rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>Send Reminder</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
