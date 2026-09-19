import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneCall,
  PhoneOff,
  PhoneForwarded,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  ShieldCheck,
  Radio,
  Volume2,
  RotateCcw,
  Check,
  X,
  Settings,
  ExternalLink,
  Signal,
  Copy,
  CheckCheck,
  Zap,
  Activity,
  Mic,
  ArrowRight
} from 'lucide-react';
import { Appointment } from '../../types';
import { api } from '../../api/client';
import { useActivityStream } from '../../context/ActivityStreamContext';
import { useAuth } from '../../context/AuthContext';

interface OutboundAICallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onRefreshData: () => void;
}

export const OutboundAICallModal: React.FC<OutboundAICallModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onRefreshData,
}) => {
  const { showToast } = useAuth();
  const { emitEvent } = useActivityStream();

  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [callLanguage, setCallLanguage] = useState<'en' | 'hi'>('en');
  const [callMode, setCallMode] = useState<'simulator' | 'twilio'>('simulator');
  
  // Twilio Telephony Credentials
  const [isTwilioConfigOpen, setIsTwilioConfigOpen] = useState<boolean>(false);
  const [twilioSid, setTwilioSid] = useState<string>('');
  const [twilioToken, setTwilioToken] = useState<string>('');
  const [twilioFrom, setTwilioFrom] = useState<string>('');
  const [isTwilioConfigured, setIsTwilioConfigured] = useState<boolean>(false);
  const [twilioError, setTwilioError] = useState<string | null>(null);

  // Call Lifecycle States
  const [callState, setCallState] = useState<'IDLE' | 'RINGING' | 'IN_CALL' | 'COMPLETED'>('IDLE');
  const [callTimer, setCallTimer] = useState<number>(0);
  const [activeScript, setActiveScript] = useState<string>('');
  const [callSid, setCallSid] = useState<string>('');
  const [callResult, setCallResult] = useState<any>(null);
  const [isProcessingKey, setIsProcessingKey] = useState<boolean>(false);
  const [twilioDispatchedSuccess, setTwilioDispatchedSuccess] = useState<boolean>(false);
  const [hasCopiedSid, setHasCopiedSid] = useState<boolean>(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<any>(null);

  // Initialize phone number and load saved Twilio config
  useEffect(() => {
    if (appointment?.patient?.phone && appointment.patient.phone.trim() !== '') {
      const cleaned = appointment.patient.phone.replace(/[^\d+]/g, '');
      setPhoneNumber(cleaned || '+917027635901');
    } else {
      setPhoneNumber('+917027635901');
    }
    setCallState('IDLE');
    setCallTimer(0);
    setCallResult(null);
    setTwilioError(null);
    setTwilioDispatchedSuccess(false);
    setHasCopiedSid(false);

    api.getTelephonyConfig().then(cfg => {
      if (cfg && cfg.is_configured) {
        setIsTwilioConfigured(true);
        setCallMode('twilio');
        if (cfg.twilio_from) setTwilioFrom(cfg.twilio_from);
      }
    }).catch(() => {});
  }, [appointment, isOpen]);

  // Speech synthesis setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSaveTwilioConfig = async () => {
    if (!twilioSid.trim() || !twilioToken.trim() || !twilioFrom.trim()) {
      showToast('Please provide Account SID, Auth Token, and Twilio Number', 'error');
      return;
    }
    try {
      await api.saveTelephonyConfig({
        twilio_sid: twilioSid,
        twilio_token: twilioToken,
        twilio_from: twilioFrom,
      });
      setIsTwilioConfigured(true);
      setIsTwilioConfigOpen(false);
      setCallMode('twilio');
      showToast('✓ Twilio Cellular Gateway configured successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save credentials', 'error');
    }
  };

  const speakIVR = (text: string, lang: 'en' | 'hi', onEnd?: () => void) => {
    if (!synthRef.current) {
      if (onEnd) setTimeout(onEnd, 2000);
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();

    if (lang === 'hi') {
      const lekha = voices.find(v => v.name.toLowerCase().includes('lekha') || v.lang.includes('hi'));
      if (lekha) utterance.voice = lekha;
      utterance.lang = 'hi-IN';
      utterance.rate = 0.90;
    } else {
      const rishi = voices.find(v => v.name.toLowerCase().includes('rishi'));
      const samantha = voices.find(v => v.name.includes('Samantha') || v.name.includes('Ava') || v.name.includes('Google US'));
      if (rishi) utterance.voice = rishi;
      else if (samantha) utterance.voice = samantha;
      utterance.lang = 'en-IN';
      utterance.rate = 0.92;
    }

    utterance.pitch = 1.0;
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    synthRef.current.speak(utterance);
  };

  // Trigger outbound call
  const handleStartCall = async () => {
    if (!appointment) return;

    // Strict E.164 normalization
    const cleanDigits = phoneNumber.replace(/[^\d+]/g, '');
    let normalizedNumber = cleanDigits;
    if (!normalizedNumber.startsWith('+')) {
      if (normalizedNumber.length === 10) {
        normalizedNumber = `+91${normalizedNumber}`;
      } else {
        normalizedNumber = `+${normalizedNumber}`;
      }
    }

    if (!normalizedNumber || normalizedNumber.length < 8) {
      showToast('Please enter a valid mobile number with country code (e.g. +917027635901)', 'error');
      return;
    }

    setPhoneNumber(normalizedNumber);
    setCallState('RINGING');
    setCallTimer(0);
    setTwilioError(null);
    setTwilioDispatchedSuccess(false);

    try {
      const resp = await api.initiateOutboundCall({
        appointment_id: appointment.id,
        phone_number: normalizedNumber,
        mode: callMode,
        language: callLanguage,
        twilio_sid: twilioSid || undefined,
        twilio_token: twilioToken || undefined,
        twilio_from: twilioFrom || undefined,
      });

      setCallSid(resp.call_sid);
      setActiveScript(resp.script);

      if (callMode === 'twilio') {
        if (resp.twilio_error || !resp.twilio_dispatched) {
          setTwilioError(resp.twilio_error || 'Twilio failed to dispatch call.');
          setCallState('IDLE');
          showToast(resp.twilio_error || 'Failed to dispatch cellular call', 'error');
          return;
        }

        setTwilioDispatchedSuccess(true);
        showToast(`📞 Dialing your mobile ${normalizedNumber}! Pick up your phone.`, 'success');
      }

      // Connect call state
      setTimeout(() => {
        setCallState('IN_CALL');
        
        timerRef.current = setInterval(() => {
          setCallTimer(prev => prev + 1);
        }, 1000);

        if (callMode === 'simulator') {
          speakIVR(resp.script, callLanguage);
        }
      }, 1500);

    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch outbound call', 'error');
      setCallState('IDLE');
    }
  };

  // Touchtone Button Pressed: 1 or 2
  const handlePressKey = async (digit: '1' | '2') => {
    if (!appointment || isProcessingKey) return;
    setIsProcessingKey(true);
    if (synthRef.current) synthRef.current.cancel();

    playTone(digit === '1' ? 697 : 770);

    try {
      const result = await api.recordCallResult({
        appointment_id: appointment.id,
        phone_number: phoneNumber,
        digits_pressed: digit,
        duration_seconds: callTimer || 28,
        notes: `Outbound AI Call (${callMode}): Patient selected Key [${digit}]`,
      });

      setCallResult(result);
      setCallState('COMPLETED');
      clearInterval(timerRef.current);

      speakIVR(result.spoken_response, callLanguage);

      if (digit === '1') {
        showToast(`✓ Attendance Confirmed via Phone Key 1 (${phoneNumber})`, 'success');
        emitEvent({
          type: 'CONFIRMATION',
          title: 'AI Phone Call Confirmed (Key 1)',
          description: `${result.patient_name} confirmed attendance with ${result.doctor_name}`,
          patientName: result.patient_name,
          doctorName: result.doctor_name,
          badge: 'Confirmed via Call',
          badgeColor: '#4F8A70',
        });
      } else {
        showToast(`⚠️ Slot Cancelled via Phone Key 2 (${phoneNumber})`, 'info');
        emitEvent({
          type: 'RECOVERY',
          title: 'Slot Released via Phone Call (Key 2)',
          description: `${result.patient_name} cancelled slot. Queued for Smart Slot Recovery`,
          patientName: result.patient_name,
          doctorName: result.doctor_name,
          badge: 'Slot Released',
          badgeColor: '#C9685B',
        });
      }

      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Error recording touchtone keypress', 'error');
    } finally {
      setIsProcessingKey(false);
    }
  };

  // Manual End Call by user / doctor
  const handleManualEndCall = async () => {
    if (synthRef.current) synthRef.current.cancel();
    if (timerRef.current) clearInterval(timerRef.current);

    const isConfirmed = appointment?.confirmation_status === 'Confirmed';
    const isCancelled = appointment?.confirmation_status === 'Cancelled';

    setCallResult({
      success: true,
      outcome: isConfirmed ? 'CONFIRMED' : isCancelled ? 'CANCELLED_FREED' : 'NO_RESPONSE',
      outcome_label: isConfirmed
        ? 'Attendance Confirmed (Key 1)'
        : isCancelled
        ? 'Appointment Cancelled (Key 2)'
        : 'Outreach Call Concluded',
      spoken_response: isConfirmed
        ? 'Slot attendance confirmed and secured.'
        : isCancelled
        ? 'Slot released to queue for standby patients.'
        : 'Call concluded and logged in patient clinical history.',
      appointment_id: appointment?.id || 0,
      patient_name: `${appointment?.patient?.first_name || 'Patient'} ${appointment?.patient?.last_name || ''}`,
      doctor_name: appointment?.doctor_name || '',
      department: appointment?.department || '',
      confirmation_status: appointment?.confirmation_status || 'Unconfirmed',
      recovery_status: appointment?.recovery_status || 'Normal',
      phone_number: phoneNumber,
      digits_pressed: isConfirmed ? '1' : isCancelled ? '2' : 'None',
      duration_seconds: callTimer || 10,
      capacity_action: isConfirmed ? 'Slot Protected' : isCancelled ? 'Recovery Queued' : 'Logged in Audit History',
      revenue_protected: 120,
      timestamp: new Date().toLocaleTimeString(),
    });

    setCallState('COMPLETED');
    showToast('✓ Call ended and audit report recorded.', 'info');
    onRefreshData();
  };

  // Real-time polling for physical cellular call completion and DTMF keypresses
  useEffect(() => {
    if (callState !== 'IN_CALL' || !appointment?.id) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const status = await api.getCallStatus(appointment.id, callSid || undefined);
        if (status && status.is_completed) {
          clearInterval(pollInterval);
          if (timerRef.current) clearInterval(timerRef.current);

          const isConfirm = status.digits_pressed === '1' || status.confirmation_status === 'Confirmed';
          const isCancel = status.digits_pressed === '2' || status.confirmation_status === 'Cancelled';

          let outcomeLabel = 'Physical Mobile Call Ended';
          let spokenResp = 'Call completed on physical cellular phone.';
          let capAction = 'Logged in Clinical Audit History';
          let outcomeType: 'CONFIRMED' | 'CANCELLED_FREED' | 'NO_RESPONSE' = 'NO_RESPONSE';

          if (isConfirm) {
            outcomeLabel = 'Attendance Confirmed via Physical Mobile Phone (Key 1)';
            spokenResp = 'Patient confirmed attendance & secured reserved slot';
            capAction = 'Slot Protected & Locked';
            outcomeType = 'CONFIRMED';
          } else if (isCancel) {
            outcomeLabel = 'Appointment Cancelled via Physical Mobile Phone (Key 2)';
            spokenResp = 'Patient released slot for urgent standby patients';
            capAction = 'Immediate Slot Recovery Triggered';
            outcomeType = 'CANCELLED_FREED';
          }

          setCallResult({
            success: true,
            outcome: outcomeType,
            outcome_label: outcomeLabel,
            spoken_response: spokenResp,
            appointment_id: appointment.id,
            patient_name: `${appointment.patient?.first_name || 'Patient'} ${appointment.patient?.last_name || ''}`,
            doctor_name: appointment.doctor_name,
            department: appointment.department,
            confirmation_status: status.confirmation_status,
            recovery_status: status.recovery_status,
            phone_number: phoneNumber,
            digits_pressed: status.digits_pressed || (isConfirm ? '1' : isCancel ? '2' : 'None'),
            duration_seconds: status.duration_seconds || callTimer || 15,
            capacity_action: capAction,
            revenue_protected: 120,
            timestamp: new Date().toLocaleTimeString(),
          });

          setCallState('COMPLETED');
          showToast(
            isConfirm
              ? '✓ Cellular Call Confirmed via Phone Key 1!'
              : isCancel
              ? '✓ Cellular Call Cancelled via Phone Key 2'
              : '✓ Call ended on physical mobile phone',
            'success'
          );
          onRefreshData();
        }
      } catch (err) {
        // Silent catch for poll intervals
      }
    }, 1500);

    return () => clearInterval(pollInterval);
  }, [callState, appointment?.id, callSid, callTimer]);

  const playTone = (freq: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {}
  };

  const handleEndCall = () => {
    if (synthRef.current) synthRef.current.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState('IDLE');
    onClose();
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopiedSid(true);
    showToast('✓ Call SID copied to clipboard', 'info');
    setTimeout(() => setHasCopiedSid(false), 2000);
  };

  if (!isOpen || !appointment) return null;

  const patient = appointment.patient;
  const missedCount = patient?.missed_appointments || 0;
  const isHighRisk = (appointment.prediction?.risk_level === 'HIGH') || missedCount >= 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          className="w-full max-w-xl bg-white dark:bg-[#181818] text-[#1D1D1F] dark:text-white rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-[0_24px_64px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col relative max-h-[92vh]"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-36 blur-[80px] pointer-events-none rounded-full transition-colors duration-700 ${
            callState === 'IN_CALL'
              ? 'bg-emerald-500/10'
              : callState === 'COMPLETED'
              ? callResult?.digits_pressed === '2' ? 'bg-rose-500/10' : 'bg-emerald-500/10'
              : 'bg-blue-500/10'
          }`} />

          {/* ===================== HEADER ===================== */}
          <div className="pt-5 pb-4 px-6 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between relative z-10 bg-[#FAFAFA] dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors shadow-2xs ${
                callState === 'IN_CALL'
                  ? 'bg-emerald-50 text-emerald-600'
                  : callState === 'COMPLETED'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-blue-50 text-blue-600'
              }`}>
                {callState === 'IN_CALL' ? (
                  <Activity className="h-4 w-4 animate-pulse" />
                ) : callState === 'COMPLETED' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <PhoneCall className="h-4 w-4" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                  AI Confirmation Call
                </h3>
                <p className="text-xs text-[#6B6B6F] dark:text-white/50">
                  {patient?.first_name} {patient?.last_name} · {appointment.appointment_time}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsTwilioConfigOpen(!isTwilioConfigOpen)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isTwilioConfigured
                    ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    : 'border-black/[0.08] text-[#6B6B6F] hover:text-[#1D1D1F] bg-black/[0.02]'
                }`}
                title="Twilio Cellular Gateway Settings"
              >
                <Signal className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={handleEndCall}
                className="h-8 w-8 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] hover:bg-black/[0.06] flex items-center justify-center text-[#6B6B6F] hover:text-[#1D1D1F] transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ===================== TWILIO CONFIG DRAWER ===================== */}
          <AnimatePresence>
            {isTwilioConfigOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[#F8F9FA] dark:bg-[#121214] border-b border-black/[0.06] dark:border-white/[0.08] p-4 space-y-3 overflow-hidden text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">Twilio Gateway Configuration</span>
                  <a
                    href="https://www.twilio.com/try-twilio"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Get Free Trial</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={twilioSid}
                    onChange={e => setTwilioSid(e.target.value)}
                    placeholder="Account SID (AC...)"
                    className="w-full bg-white dark:bg-white/[0.04] border border-black/[0.12] dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] dark:text-white font-mono focus:outline-hidden focus:border-blue-500 shadow-2xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="password"
                      value={twilioToken}
                      onChange={e => setTwilioToken(e.target.value)}
                      placeholder="Auth Token"
                      className="w-full bg-white dark:bg-white/[0.04] border border-black/[0.12] dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] dark:text-white font-mono focus:outline-hidden focus:border-blue-500 shadow-2xs"
                    />
                    <input
                      type="text"
                      value={twilioFrom}
                      onChange={e => setTwilioFrom(e.target.value)}
                      placeholder="Caller ID (+1...)"
                      className="w-full bg-white dark:bg-white/[0.04] border border-black/[0.12] dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] dark:text-white font-mono focus:outline-hidden focus:border-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveTwilioConfig}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-2xs cursor-pointer"
                  >
                    Save Gateway
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===================== MODAL CONTENT BODY ===================== */}
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Twilio Error Alert */}
            {twilioError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-xs leading-tight">{twilioError}</span>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* VIEW A: IDLE / CONFIGURATION STATE                       */}
            {/* ======================================================== */}
            {callState === 'IDLE' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Segmented Mode Selector */}
                <div className="p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setCallMode('twilio')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      callMode === 'twilio'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-[#6B6B6F] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <Signal className="h-3.5 w-3.5" />
                    <span>Cellular Call</span>
                    {isTwilioConfigured && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => setCallMode('simulator')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      callMode === 'simulator'
                        ? 'bg-white text-[#1D1D1F] shadow-xs'
                        : 'text-[#6B6B6F] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Web Demo</span>
                  </button>
                </div>

                {/* Patient Clinical Profile Card */}
                <div className="p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-white/[0.03] border border-black/[0.06] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#1D1D1F] text-sm">
                      {patient?.first_name} {patient?.last_name}
                    </div>
                    <div className="text-xs text-[#6B6B6F] mt-0.5">
                      {appointment.doctor_name} · {appointment.department}
                    </div>
                    <div className="text-xs text-[#444447] mt-1 flex items-center gap-2">
                      <span>{appointment.appointment_date}</span>
                      <span>•</span>
                      <span>{appointment.appointment_time}</span>
                    </div>
                  </div>

                  {missedCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{missedCount} Missed</span>
                    </span>
                  )}
                </div>

                {/* Destination Phone Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#1D1D1F]">
                      Recipient Phone
                    </label>
                    <button
                      type="button"
                      onClick={() => setPhoneNumber('+917027635901')}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="h-3 w-3" />
                      <span>Use +917027635901</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sm">
                        🇮🇳
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="+91 70276 35901"
                        className="w-full bg-white dark:bg-white/[0.04] border border-black/[0.12] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#1D1D1F] font-mono focus:outline-hidden focus:border-blue-500 shadow-2xs"
                      />
                    </div>

                    <div className="p-0.5 rounded-xl bg-black/[0.04] border border-black/[0.06] flex items-center">
                      <button
                        type="button"
                        onClick={() => setCallLanguage('en')}
                        className={`px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          callLanguage === 'en'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-[#6B6B6F] hover:text-[#1D1D1F]'
                        }`}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => setCallLanguage('hi')}
                        className={`px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          callLanguage === 'hi'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-[#6B6B6F] hover:text-[#1D1D1F]'
                        }`}
                      >
                        हिंदी
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary Launch Action */}
                <div className="pt-1">
                  <button
                    onClick={handleStartCall}
                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>Call Patient ({phoneNumber})</span>
                    <ArrowRight className="h-4 w-4 ml-1 opacity-70" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* VIEW B: RINGING / ACTIVE IN-CALL STATE                    */}
            {/* ======================================================== */}
            {(callState === 'RINGING' || callState === 'IN_CALL') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Active Call Live Header Banner */}
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="font-semibold text-sm text-[#1D1D1F]">
                      Call in Progress ({phoneNumber})
                    </span>
                  </div>

                  <div className="font-mono font-bold text-xs text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200/60 shadow-2xs">
                    {formatTimer(callTimer)}
                  </div>
                </div>

                {/* Equalizer Wave */}
                <div className="p-3 rounded-2xl bg-[#F8F9FA] border border-black/[0.06] flex items-center justify-center">
                  <div className="flex items-center justify-center gap-1 h-8 w-full max-w-[240px]">
                    {[35, 70, 50, 90, 60, 80, 45, 75, 55, 85, 65, 45].map((height, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 rounded-full bg-blue-600"
                        animate={{
                          height: callState === 'IN_CALL' ? [`${Math.max(20, height * 0.3)}%`, `${height}%`, `${Math.max(25, height * 0.4)}%`] : '25%',
                        }}
                        transition={{
                          duration: 0.7 + (i % 3) * 0.15,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          ease: 'easeInOut',
                          delay: i * 0.04,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Spoken Script Bubble */}
                <div className="p-3 rounded-xl bg-white border border-black/[0.08] text-xs">
                  <p className="text-[#333336] italic text-xs leading-relaxed">
                    "{activeScript || 'Connecting call...'}"
                  </p>
                </div>

                {/* Keypad Response Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handlePressKey('1')}
                    disabled={isProcessingKey}
                    className="py-3 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-2xs"
                  >
                    <span className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">1</span>
                    <span>Confirm</span>
                  </button>

                  <button
                    onClick={() => handlePressKey('2')}
                    disabled={isProcessingKey}
                    className="py-3 px-3 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-900 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-2xs"
                  >
                    <span className="h-6 w-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-xs">2</span>
                    <span>Cancel</span>
                  </button>
                </div>

                {/* End Call */}
                <button
                  onClick={handleManualEndCall}
                  className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <PhoneOff className="h-3.5 w-3.5" />
                  <span>End Call</span>
                </button>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* VIEW C: COMPLETED CALL AUDIT                             */}
            {/* ======================================================== */}
            {callState === 'COMPLETED' && callResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Result Hero Banner */}
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3 shadow-2xs ${
                    callResult.digits_pressed === '1' || callResult.outcome === 'CONFIRMED'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : callResult.digits_pressed === '2' || callResult.outcome === 'CANCELLED'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-white ${
                    callResult.digits_pressed === '1' || callResult.outcome === 'CONFIRMED'
                      ? 'bg-emerald-600'
                      : callResult.digits_pressed === '2' || callResult.outcome === 'CANCELLED'
                      ? 'bg-rose-600'
                      : 'bg-slate-700'
                  }`}>
                    {callResult.digits_pressed === '1' || callResult.outcome === 'CONFIRMED' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : callResult.digits_pressed === '2' || callResult.outcome === 'CANCELLED' ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <PhoneOff className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold">
                      {callResult.outcome_label || 'Call Concluded'}
                    </div>
                    <div className="text-xs opacity-75 mt-0.5">
                      {callResult.spoken_response || 'Logged in appointment history'}
                    </div>
                  </div>
                </div>

                {/* Compact 3-Column Summary */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#F8F9FA] border border-black/[0.06] text-center">
                    <span className="text-[10px] text-[#6B6B6F] uppercase block mb-1">Response</span>
                    <span className="font-semibold text-[#1D1D1F]">
                      {callResult.digits_pressed === '1'
                        ? 'Confirmed'
                        : callResult.digits_pressed === '2'
                        ? 'Cancelled'
                        : 'Completed'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8F9FA] border border-black/[0.06] text-center">
                    <span className="text-[10px] text-[#6B6B6F] uppercase block mb-1">Duration</span>
                    <span className="font-semibold text-[#1D1D1F] font-mono">
                      {callResult.duration_seconds || 18}s
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8F9FA] border border-black/[0.06] text-center">
                    <span className="text-[10px] text-[#6B6B6F] uppercase block mb-1">Call SID</span>
                    <button
                      onClick={() => copyToClipboard(callSid)}
                      className="font-mono text-blue-600 hover:underline text-xs truncate max-w-[90px] mx-auto block cursor-pointer"
                      title="Click to copy Call SID"
                    >
                      {callSid ? `${callSid.slice(0, 8)}...` : 'Verified'}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setCallState('IDLE');
                      setCallResult(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-black/[0.12] text-xs font-semibold text-[#1D1D1F] bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                  >
                    Call Again
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="flex-1 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-[#2C2C2E] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
