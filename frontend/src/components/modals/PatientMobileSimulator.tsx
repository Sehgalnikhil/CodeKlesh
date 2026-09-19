import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Smartphone,
  Check,
  CheckCheck,
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  Stethoscope,
  Send
} from 'lucide-react';
import { Appointment } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useActivityStream } from '../../context/ActivityStreamContext';

interface PatientMobileSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  onRefreshClinicData: () => void;
}

export const PatientMobileSimulator: React.FC<PatientMobileSimulatorProps> = ({
  isOpen,
  onClose,
  appointments,
  onRefreshClinicData,
}) => {
  const { showToast } = useAuth();
  const { emitEvent } = useActivityStream();
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasConfirmedLocally, setHasConfirmedLocally] = useState(false);
  const [hasCancelledLocally, setHasCancelledLocally] = useState(false);

  if (!isOpen) return null;

  // Default to first unconfirmed appointment
  const unconfirmedApps = appointments.filter(a => a.confirmation_status !== 'Confirmed');
  const targetApp = (selectedAppId ? appointments.find(a => a.id === selectedAppId) : null) || unconfirmedApps[0] || appointments[0];

  if (!targetApp) return null;

  const patient = targetApp.patient;

  const handlePatientConfirm = async () => {
    try {
      setIsProcessing(true);
      await api.updateAppointmentStatus(targetApp.id, {
        confirmation_status: 'Confirmed',
        status: 'Scheduled',
      });

      setHasConfirmedLocally(true);
      setHasCancelledLocally(false);

      emitEvent({
        type: 'CONFIRMATION',
        title: 'Patient Mobile Confirmation',
        description: `${patient?.first_name} ${patient?.last_name} tapped "Confirm" for ${targetApp.appointment_time} visit with ${targetApp.doctor_name}`,
        patientName: `${patient?.first_name} ${patient?.last_name}`,
        doctorName: targetApp.doctor_name,
        badge: 'WhatsApp',
        badgeColor: '#4F8A70',
      });

      showToast(`✓ Received live patient confirmation from ${patient?.first_name} ${patient?.last_name}`, 'success');
      onRefreshClinicData();
    } catch (err: any) {
      showToast(err.message || 'Confirmation failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePatientCancel = async () => {
    try {
      setIsProcessing(true);
      await api.updateAppointmentStatus(targetApp.id, {
        confirmation_status: 'Cancelled',
        status: 'Cancelled',
      });

      setHasCancelledLocally(true);
      setHasConfirmedLocally(false);

      emitEvent({
        type: 'RECOVERY',
        title: 'Slot Released via Patient Request',
        description: `${patient?.first_name} ${patient?.last_name} requested reschedule for ${targetApp.appointment_time} slot - waitlist backfill queued`,
        patientName: `${patient?.first_name} ${patient?.last_name}`,
        doctorName: targetApp.doctor_name,
        badge: 'Slot Open',
        badgeColor: '#C9685B',
      });

      showToast(`✓ ${patient?.first_name} requested reschedule. Slot freed for Waitlist backfill.`, 'info');
      onRefreshClinicData();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 350 }}
          className="bg-white/95 dark:bg-[#181818]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col"
        >
          {/* Top Bar with Patient Switcher */}
          <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-[#1D1D1F] dark:text-white" />
              <div>
                <h3 className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
                  Patient Mobile View (Live Test)
                </h3>
                <span className="text-[10px] text-[#6B6B6F] block">
                  Simulates patient recipient screen
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-7 w-7 rounded-full border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Switch Active Patient Dropdown */}
          <div className="px-4 py-2 border-b border-black/[0.04] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#6B6B6F]">Simulating:</span>
            <select
              value={targetApp.id}
              onChange={e => {
                setSelectedAppId(parseInt(e.target.value));
                setHasConfirmedLocally(false);
                setHasCancelledLocally(false);
              }}
              className="text-xs font-medium bg-transparent text-[#1D1D1F] dark:text-white focus:outline-none cursor-pointer text-right max-w-[200px] truncate"
            >
              {appointments.slice(0, 10).map(a => (
                <option key={a.id} value={a.id} className="bg-white dark:bg-[#181818] text-[#1D1D1F] dark:text-white">
                  {a.patient?.first_name} {a.patient?.last_name} ({a.appointment_time})
                </option>
              ))}
            </select>
          </div>

          {/* iPhone Glass Screen Body */}
          <div className="p-4 space-y-4 bg-gradient-to-b from-black/[0.01] to-black/[0.03] dark:from-white/[0.01] dark:to-white/[0.03]">
            {/* WhatsApp / SMS Card Preview */}
            <div className="rounded-2xl bg-white dark:bg-[#202022] p-4 shadow-sm border border-black/[0.06] dark:border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.06] pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-[10px] font-bold">
                    SC
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-[#1D1D1F] dark:text-white block">
                      City Health Clinical
                    </span>
                    <span className="text-[9px] text-[#4F8A70]">Verified Healthcare Account</span>
                  </div>
                </div>
                <span className="text-[10px] text-[#6B6B6F]">09:41 AM</span>
              </div>

              <div className="text-xs space-y-2 text-[#1D1D1F] dark:text-zinc-200 leading-relaxed">
                <p>
                  Hello <strong>{patient?.first_name}</strong>, this is an automated reminder for your appointment:
                </p>
                <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] space-y-1 text-[11px]">
                  <div>👨‍⚕️ <strong>Clinician:</strong> {targetApp.doctor_name} ({targetApp.department})</div>
                  <div>📅 <strong>Schedule:</strong> {targetApp.appointment_date} at {targetApp.appointment_time}</div>
                  <div>🏥 <strong>Location:</strong> Outpatient Suite 3B</div>
                </div>
                <p className="text-[11px] text-[#6B6B6F]">
                  Please tap below to confirm your visit and secure your clinic slot.
                </p>
              </div>

              {/* Live Interactive Action Buttons */}
              <div className="space-y-2 pt-1">
                {hasConfirmedLocally || targetApp.confirmation_status === 'Confirmed' ? (
                  <div className="p-2.5 rounded-xl bg-[#4F8A70]/10 border border-[#4F8A70]/20 flex items-center justify-center gap-1.5 text-xs text-[#4F8A70] font-semibold">
                    <CheckCheck className="h-4 w-4" />
                    <span>✓ Attendance Confirmed</span>
                  </div>
                ) : hasCancelledLocally || targetApp.status === 'Cancelled' ? (
                  <div className="p-2.5 rounded-xl bg-[#C9685B]/10 border border-[#C9685B]/20 flex items-center justify-center gap-1.5 text-xs text-[#C9685B] font-semibold">
                    <span>✕ Cancelled / Reschedule Requested</span>
                  </div>
                ) : (
                  <>
                    <button
                      disabled={isProcessing}
                      onClick={handlePatientConfirm}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#1D1D1F] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#E5E5EA] text-white dark:text-[#1D1D1F] text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      <span>Confirm {targetApp.appointment_time} Visit</span>
                    </button>

                    <button
                      disabled={isProcessing}
                      onClick={handlePatientCancel}
                      className="w-full py-2 px-3 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white text-xs font-medium transition-all text-center"
                    >
                      Can't Make It / Request Reschedule
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.06] dark:border-white/[0.08] text-center text-[10px] text-[#6B6B6F]">
            Interactive test tool: Actions update database and clinic dashboard live.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
