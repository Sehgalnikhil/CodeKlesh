import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Radio,
  AlertTriangle,
  Send,
  Sparkles,
  Users,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Stethoscope
} from 'lucide-react';
import { Appointment } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useActivityStream } from '../../context/ActivityStreamContext';

interface DoctorDelayBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  onRefreshClinicData?: () => void;
}

export const DoctorDelayBroadcastModal: React.FC<DoctorDelayBroadcastModalProps> = ({
  isOpen,
  onClose,
  appointments,
  onRefreshClinicData,
}) => {
  const { showToast } = useAuth();
  const { emitEvent } = useActivityStream();

  // Extract unique doctors from today's appointments
  const uniqueDoctors = Array.from(new Set(appointments.map(a => a.doctor_name))).filter(Boolean);
  const defaultDoctor = uniqueDoctors[0] || 'Dr. Aditi Sharma';

  const [selectedDoctor, setSelectedDoctor] = useState<string>(defaultDoctor);
  const [delayMinutes, setDelayMinutes] = useState<number>(30);
  const [reason, setReason] = useState<string>('emergency_surgery');
  const [customReasonText, setCustomReasonText] = useState<string>('Emergency OT procedure overrun');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    success: boolean;
    doctor_name: string;
    delay_minutes: number;
    affected_count: number;
    affected_patients: Array<{
      id: number;
      patient_name: string;
      original_time: string;
      adjusted_time: string;
    }>;
  } | null>(null);

  // Sync selected doctor if list changes
  useEffect(() => {
    if (uniqueDoctors.length > 0 && !uniqueDoctors.includes(selectedDoctor)) {
      setSelectedDoctor(uniqueDoctors[0]);
    }
  }, [appointments]);

  // Keyboard close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter affected patients for selected doctor
  const doctorAppointments = appointments.filter(
    a => a.doctor_name === selectedDoctor && a.confirmation_status !== 'cancelled'
  );

  const reasonsMap: Record<string, string> = {
    emergency_surgery: 'Emergency OT Procedure',
    icu_rounds: 'Prolonged Critical ICU Rounds',
    traffic_transit: 'Severe Transit & Traffic Congestion',
    procedure_overrun: 'Complex In-Clinic Procedure Overrun',
    clinical_urgency: 'Acute Patient Consultation Delay',
  };

  const handleBroadcast = async () => {
    try {
      setIsBroadcasting(true);
      const res = await api.broadcastDoctorDelay({
        doctor_name: selectedDoctor,
        delay_minutes: delayMinutes,
        reason: customReasonText || reasonsMap[reason] || 'Clinical Emergency',
      });

      setBroadcastResult(res);
      showToast(
        `🚨 Broadcast dispatched to ${res.affected_count} patients for ${selectedDoctor} (+${delayMinutes}m)`,
        'success'
      );

      emitEvent({
        type: 'REMINDER',
        title: 'Doctor Delay Broadcast',
        description: `🚨 ${selectedDoctor} delayed by ${delayMinutes}m. ${res.affected_count} patients re-timed via WhatsApp.`,
        doctorName: selectedDoctor,
        badge: `+${delayMinutes}m Delay`,
        badgeColor: 'amber',
      });

      if (onRefreshClinicData) {
        onRefreshClinicData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch broadcast', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const resetAndClose = () => {
    setBroadcastResult(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="bg-stone-50 border border-stone-200/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-stone-200/70 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 shadow-sm">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-stone-900">Doctor Delay Wave Broadcast</h2>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                    Live WhatsApp Dispatch
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Instantly push schedule adjustments to all scheduled patients via WhatsApp concierge
                </p>
              </div>
            </div>
            <button
              onClick={resetAndClose}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-stone-700">
            {broadcastResult ? (
              /* Success State */
              <div className="space-y-5">
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-emerald-950 text-base">Broadcast Successfully Dispatched</h3>
                    <p className="text-xs text-emerald-800 mt-1">
                      {broadcastResult.affected_count} patients under <strong>{broadcastResult.doctor_name}</strong> have been notified via WhatsApp with an automatic +{broadcastResult.delay_minutes} minute shift.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2.5">
                    Adjusted Patient Schedules ({broadcastResult.affected_patients.length})
                  </h4>
                  <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-200/60 bg-white">
                    {broadcastResult.affected_patients.map((p) => (
                      <div key={p.id} className="p-3 flex items-center justify-between text-xs hover:bg-stone-50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-700 font-semibold flex items-center justify-center text-[11px]">
                            {p.patient_name[0]}
                          </div>
                          <div>
                            <span className="font-medium text-stone-900">{p.patient_name}</span>
                            <div className="text-[11px] text-stone-500">Appointment #{p.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <span className="line-through text-stone-400">{p.original_time}</span>
                          <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            {p.adjusted_time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={resetAndClose}
                    className="px-4 py-2 bg-stone-900 text-stone-50 rounded-xl text-xs font-semibold hover:bg-stone-800 shadow-sm"
                  >
                    Done & Return to Operations
                  </button>
                </div>
              </div>
            ) : (
              /* Config & Dispatch View */
              <div className="space-y-5">
                {/* Doctor Selection */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-stone-500" />
                    Select Delayed Clinician
                  </label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
                  >
                    {uniqueDoctors.map((doc) => {
                      const count = appointments.filter(a => a.doctor_name === doc && a.confirmation_status !== 'cancelled').length;
                      return (
                        <option key={doc} value={doc}>
                          {doc} — {count} scheduled today
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Delay Duration */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    Delay Duration
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDelayMinutes(mins)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          delayMinutes === mins
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/20'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100/70'
                        }`}
                      >
                        +{mins} mins
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-stone-500" />
                    Clinical Delay Reason
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setCustomReasonText(reasonsMap[e.target.value]);
                    }}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm mb-2"
                  >
                    <option value="emergency_surgery">Emergency OT Procedure Overrun</option>
                    <option value="icu_rounds">Prolonged Critical ICU Rounds</option>
                    <option value="procedure_overrun">Complex In-Clinic Case Overrun</option>
                    <option value="traffic_transit">Doctor In-Transit / Traffic Congestion</option>
                    <option value="clinical_urgency">Acute Patient Priority Care</option>
                  </select>
                  <input
                    type="text"
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                    placeholder="Customized reason sent in WhatsApp alert..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>

                {/* WhatsApp Message Preview */}
                <div className="p-3.5 bg-stone-100/80 border border-stone-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Patient Broadcast Preview</span>
                  </div>
                  <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-lg p-3 text-xs text-emerald-950 font-sans leading-relaxed">
                    <p>
                      <strong>SlotSure Healthcare Alert:</strong> Dear Patient, <strong>{selectedDoctor}</strong> is currently attending to an <em>{customReasonText || 'unavoidable clinical emergency'}</em> and will be delayed by approximately <strong>{delayMinutes} minutes</strong>.
                    </p>
                    <p className="mt-2 text-[11px] text-emerald-800">
                      ⏱ Your adjusted consultation slot has been safely preserved. Please arrive {delayMinutes} minutes later than originally scheduled.
                    </p>
                  </div>
                </div>

                {/* Impact Summary */}
                <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-700" />
                    <span><strong>{doctorAppointments.length}</strong> patients will receive WhatsApp alerts instantly</span>
                  </div>
                  <span className="font-semibold text-amber-800">Zero No-Shows Prevented</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!broadcastResult && (
            <div className="px-6 py-4 bg-stone-100/70 border-t border-stone-200/80 flex items-center justify-between">
              <span className="text-[11px] text-stone-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Preserves queue order & patient trust
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-200/50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBroadcast}
                  disabled={isBroadcasting || doctorAppointments.length === 0}
                  className="px-5 py-2 text-xs font-semibold bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all flex items-center gap-2 shadow-sm shadow-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBroadcasting ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      Dispatching Wave...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Broadcast +{delayMinutes}m Delay
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
