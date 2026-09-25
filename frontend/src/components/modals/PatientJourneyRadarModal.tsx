import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Compass,
  Clock,
  User,
  Stethoscope,
  MapPin,
  Wifi,
  Coffee,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  Sparkles,
  RefreshCw,
  Share2,
  Copy,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Appointment, QueueRadarResponse } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useActivityStream } from '../../context/ActivityStreamContext';

interface PatientJourneyRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onRefreshClinicData?: () => void;
}

export const PatientJourneyRadarModal: React.FC<PatientJourneyRadarModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onRefreshClinicData,
}) => {
  const { showToast } = useAuth();
  const { emitEvent } = useActivityStream();

  const [radarData, setRadarData] = useState<QueueRadarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(720);
  const [isRequestingDelay, setIsRequestingDelay] = useState(false);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Keyboard shortcut to close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleShareTrackingLink = () => {
    const url = `${window.location.origin}/?track=${appointment?.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('✓ Patient Live Journey Tracking Link copied!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const fetchRadarTelemetry = async () => {
    if (!appointment) return;
    try {
      setLoading(true);
      const data = await api.getQueueRadar(appointment.id);
      setRadarData(data);
      setSecondsRemaining(data.countdown_seconds);
    } catch (err: any) {
      showToast(err.message || 'Error loading live radar telemetry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && appointment) {
      fetchRadarTelemetry();
    }
  }, [isOpen, appointment]);

  // Live countdown timer ticking every second
  useEffect(() => {
    if (!isOpen || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, secondsRemaining]);

  if (!isOpen || !appointment) return null;

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleRequestDelay = async (delayMins: number) => {
    if (!appointment || isRequestingDelay) return;
    try {
      setIsRequestingDelay(true);
      const res = await api.requestQueueDelay(
        appointment.id,
        delayMins,
        'Patient requested delay via Journey Radar'
      );

      showToast(
        `✓ Buffer granted! Swapped with ${res.swapped_with}. New slot: ${res.new_appointment_time}`,
        'success'
      );

      emitEvent({
        type: 'RECOVERY',
        title: 'Autonomous Queue Position Swapped',
        description: `${radarData?.patient_name || 'Patient'} requested +${delayMins}m buffer. Autonomously swapped queue slot with ${res.swapped_with}.`,
        patientName: radarData?.patient_name || 'Patient',
        doctorName: appointment.doctor_name,
        badge: 'Live Radar',
        badgeColor: '#0ea5e9',
      });

      // Refetch live telemetry
      await fetchRadarTelemetry();
      onRefreshClinicData?.();
    } catch (err: any) {
      showToast(err.message || 'Could not adjust queue buffer', 'error');
    } finally {
      setIsRequestingDelay(false);
    }
  };

  const copyWifiPassword = () => {
    if (radarData?.amenities.wifi_pass) {
      navigator.clipboard.writeText(radarData.amenities.wifi_pass);
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden"
        >
          {/* Top Bar / Header - Clean Modern Clinical Design */}
          <div className="px-5 py-4 bg-white/95 border-b border-slate-200 flex items-center justify-between z-10 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-2xs">
                <Compass className="w-5 h-5 text-emerald-600 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">Patient Live Journey Radar</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    LIVE TELEMETRY
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {appointment.patient
                    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
                    : 'Patient'}{' '}
                  • APT-#{appointment.id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareTrackingLink}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                title={copiedLink ? 'Link copied!' : 'Share patient live tracking link'}
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>
              <button
                onClick={fetchRadarTelemetry}
                disabled={loading}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
                title="Refresh Live Radar"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Radar Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loading && !radarData ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-xs text-slate-500 font-mono">
                  Synchronizing with clinic IoT beacon & queue telemetry...
                </p>
              </div>
            ) : radarData ? (
              <>
                {/* Visual Soft Concentric Radar Screen (Light Clinical Aesthetic) */}
                <div className="relative rounded-2xl bg-gradient-to-b from-emerald-50/70 via-slate-50/60 to-white border border-emerald-200/80 p-6 overflow-hidden text-center shadow-xs">
                  {/* Radar Circles Background in subtle emerald tints */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <div className="w-72 h-72 rounded-full border border-emerald-300/40 animate-ping" />
                    <div className="w-56 h-56 rounded-full border border-emerald-300/50" />
                    <div className="w-40 h-40 rounded-full border border-emerald-300/60" />
                    <div className="w-24 h-24 rounded-full border border-emerald-400/80" />
                  </div>

                  {/* Sweep Line */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                    <div className="w-72 h-72 rounded-full bg-gradient-to-tr from-transparent via-emerald-400/30 to-transparent animate-spin-slow" />
                  </div>

                  {/* Center Doctor Suite Beacon */}
                  <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {radarData.doctor_name} • {radarData.exam_room}
                      </span>
                    </div>

                    {/* Big Live Countdown */}
                    <div className="pt-2">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-800 font-bold">
                        Estimated Entry In
                      </span>
                      <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-950">
                        {secondsRemaining > 0 ? formatCountdown(secondsRemaining) : 'NOW READY'}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Expected consultation entry:{' '}
                        <strong className="text-emerald-800 font-bold">{radarData.estimated_entry_time}</strong>
                      </p>
                    </div>

                    {/* Active Exam Room status */}
                    <div className="pt-1.5 px-3.5 py-1.5 rounded-xl bg-white/95 border border-slate-200/90 text-xs text-slate-700 max-w-md mx-auto flex items-center gap-2 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="truncate">{radarData.current_patient_in_room}</span>
                    </div>
                  </div>
                </div>

                {/* Queue Position Pill & Key Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 text-center shadow-2xs">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Position in Line</span>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">
                      #{radarData.queue_position}{' '}
                      <span className="text-xs text-slate-500 font-normal">of {radarData.total_in_queue}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Live waiting queue</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 text-center shadow-2xs">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Doctor Velocity</span>
                    <div className="text-2xl font-black text-emerald-700 mt-0.5">
                      {radarData.average_consult_duration_mins}m{' '}
                      <span className="text-xs text-slate-500 font-normal">/pt</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Pacing on schedule</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 text-center shadow-2xs">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Booked Slot</span>
                    <div className="text-lg font-black text-slate-900 mt-1 truncate">
                      {radarData.appointment_time}
                    </div>
                    <span className="text-[10px] text-slate-500 truncate">{radarData.appointment_date}</span>
                  </div>
                </div>

                {/* Running Late? Autonomous Position Swap Button Section */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-white to-slate-50 border border-emerald-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-emerald-700" />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">Running a Few Minutes Late?</h4>
                        <p className="text-[11px] text-slate-600">
                          Tap a buffer button below to seamlessly adjust your place in the clinic queue.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      NO CALL NEEDED
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {[5, 10, 15].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => handleRequestDelay(mins)}
                        disabled={isRequestingDelay}
                        className="flex-1 py-2.5 rounded-xl bg-white hover:bg-emerald-50 active:scale-95 border border-slate-200 hover:border-emerald-300 text-slate-800 hover:text-emerald-900 text-xs font-bold transition-all shadow-2xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+{mins} Mins Buffer</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Milestone Step-by-Step Progress Timeline */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Clinical Journey Milestones
                  </h4>

                  <div className="space-y-3">
                    {radarData.milestones.map((m) => (
                      <div key={m.step} className="flex items-start gap-3 relative">
                        <div className="pt-0.5">
                          {m.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : m.current ? (
                            <div className="w-4 h-4 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-200 bg-slate-100 text-[9px] font-mono text-slate-500 flex items-center justify-center">
                              {m.step}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span
                              className={`font-semibold ${
                                m.completed || m.current ? 'text-slate-900 font-bold' : 'text-slate-400'
                              }`}
                            >
                              {m.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{m.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">{m.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hospital Lounge & Amenities Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                    Lounge Amenities & Perks (While You Wait)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-emerald-100/80 text-emerald-700">
                          <Wifi className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-slate-800">{radarData.amenities.wifi_ssid}</p>
                          <p className="text-[10px] font-mono text-slate-500">Pass: {radarData.amenities.wifi_pass}</p>
                        </div>
                      </div>
                      <button
                        onClick={copyWifiPassword}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-medium text-slate-700 transition-colors shadow-2xs"
                      >
                        {copiedWifi ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-amber-100/80 text-amber-700 shrink-0">
                        <Coffee className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-800">Cafeteria Coupon</p>
                        <p className="text-[10px] text-amber-700 font-mono font-bold">
                          {radarData.amenities.cafeteria_discount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Footer Bar */}
          <div className="px-5 py-3.5 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>SlotSure Real-Time Queue Telemetry</span>
            </span>
            <button
              onClick={onClose}
              className="px-5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors shadow-xs text-xs"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
