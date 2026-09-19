import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Phone, Send, X, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
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

  const currentProb = Math.round((appointment.prediction?.risk_probability || 0.87) * 100);
  const impactProb = Math.round((appointment.prediction?.estimated_impact_prob || 0.68) * 100);

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

      showToast(`✓ Reminder scheduled: ${channel} dispatched to ${appointment.patient?.phone}`, 'success');
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-dropdown max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Send Preventive Reminder
                </h3>
                <p className="text-xs text-zinc-500">
                  Target patient: {appointment.patient?.first_name} {appointment.patient?.last_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Impact Projection Card */}
            <div className="p-3.5 bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/50 rounded-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-600 dark:text-zinc-300">
                  Estimated Risk Impact
                </span>
                <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-100/70 dark:bg-brand-900/80 px-2 py-0.5 rounded-full">
                  AI Projection
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {currentProb}%
                </span>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {impactProb}%
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded">
                  -{currentProb - impactProb}% Risk
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                Automated 2-way confirmation message with one-tap confirmation link.
              </p>
            </div>

            {/* Channel Selection */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Communication Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['SMS', 'WhatsApp', 'Phone Call'] as const).map(ch => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                      channel === ch
                        ? 'border-brand-600 bg-brand-50/50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-500'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {ch === 'SMS' && <MessageSquare className="h-4 w-4" />}
                    {ch === 'WhatsApp' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {ch === 'Phone Call' && <Phone className="h-4 w-4" />}
                    <span>{ch}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Timing Selection */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Dispatch Schedule
              </label>
              <select
                value={scheduledFor}
                onChange={e => setScheduledFor(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="24 hours before appointment">24 hours before appointment (Recommended)</option>
                <option value="48 hours before appointment">48 hours before appointment</option>
                <option value="Immediate dispatch">Send Immediately</option>
                <option value="Morning of appointment (7:00 AM)">Morning of appointment (7:00 AM)</option>
              </select>
            </div>

            {/* Phone Confirmation */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Recipient: </span>
              {appointment.patient?.phone} ({appointment.patient?.first_name} {appointment.patient?.last_name})
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-soft transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Scheduling...</span>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Reminder</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
