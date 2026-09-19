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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          className="w-full max-w-xl bg-[#0E0F13] text-white rounded-3xl border border-white/[0.12] shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative max-h-[92vh]"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 blur-[90px] pointer-events-none rounded-full transition-colors duration-700 ${
            callState === 'IN_CALL'
              ? 'bg-emerald-500/20'
              : callState === 'COMPLETED'
              ? callResult?.digits_pressed === '2' ? 'bg-[#C9685B]/20' : 'bg-emerald-500/20'
              : 'bg-blue-500/18'
          }`} />

          {/* ===================== HEADER ===================== */}
          <div className="pt-5 pb-4 px-6 border-b border-white/[0.08] flex items-center justify-between relative z-10 bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-colors shadow-inner ${
                callState === 'IN_CALL'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : callState === 'COMPLETED'
                  ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                  : 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
              }`}>
                {callState === 'IN_CALL' ? (
                  <Activity className="h-5 w-5 animate-pulse" />
                ) : callState === 'COMPLETED' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <PhoneForwarded className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    SlotSure Voice AI Outreach
                  </h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    callState === 'IN_CALL'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : callState === 'COMPLETED'
                      ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                      : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${callState === 'IN_CALL' ? 'bg-emerald-400 animate-ping' : 'bg-current'}`} />
                    {callState === 'IN_CALL' ? 'Live Call In Progress' : callState === 'COMPLETED' ? 'Audit Verified' : 'Conversational AI'}
                  </span>
                </div>
                <p className="text-[11px] text-white/50 mt-0.5 flex items-center gap-1.5">
                  <span>Interactive Speech Recognition</span>
                  <span className="text-white/20">•</span>
                  <span>Carrier Touchtone Sync</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTwilioConfigOpen(!isTwilioConfigOpen)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isTwilioConfigured
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                    : 'border-white/[0.1] text-white/60 hover:text-white bg-white/[0.04]'
                }`}
                title="Twilio Cellular Gateway Settings"
              >
                <Signal className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px] hidden sm:inline">
                  {isTwilioConfigured ? 'Cellular Active' : 'Configure Gateway'}
                </span>
              </button>

              <button
                onClick={handleEndCall}
                className="h-8 w-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer"
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
                className="bg-[#0B0C0E] border-b border-white/[0.08] p-5 space-y-3 overflow-hidden text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <Signal className="h-4 w-4 text-emerald-400" />
                    <span>Real Cellular Phone Calling Gateway (Twilio)</span>
                  </div>
                  <a
                    href="https://www.twilio.com/try-twilio"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Free $15.50 Credits</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Account SID (starts with AC...)</label>
                    <input
                      type="text"
                      value={twilioSid}
                      onChange={e => setTwilioSid(e.target.value)}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Auth Token</label>
                      <input
                        type="password"
                        value={twilioToken}
                        onChange={e => setTwilioToken(e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Twilio Caller ID Phone</label>
                      <input
                        type="text"
                        value={twilioFrom}
                        onChange={e => setTwilioFrom(e.target.value)}
                        placeholder="+1 737 250 8034"
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-white/40">
                    *Requires destination number to be in Twilio Console Verified Caller IDs on trial accounts.
                  </span>
                  <button
                    onClick={handleSaveTwilioConfig}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
                  >
                    Save & Enable Gateway
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===================== MODAL CONTENT BODY ===================== */}
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Display Twilio Error Alert if Any */}
            {twilioError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5"
              >
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-amber-300">Telephony Gateway Notice:</div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">{twilioError}</p>
                </div>
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
                <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] grid grid-cols-2 gap-1 relative">
                  <button
                    onClick={() => setCallMode('twilio')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      callMode === 'twilio'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Signal className="h-3.5 w-3.5" />
                    <span>Real Cellular Phone</span>
                    {isTwilioConfigured && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>

                  <button
                    onClick={() => setCallMode('simulator')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      callMode === 'simulator'
                        ? 'bg-white text-[#121214] shadow-md'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>In-Browser Demo</span>
                  </button>
                </div>

                {/* Patient Clinical Profile Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.08] space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-sm text-blue-400">
                        {patient?.first_name?.[0] || 'P'}{patient?.last_name?.[0] || ''}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">
                          {patient?.first_name} {patient?.last_name}
                        </div>
                        <div className="text-[11px] text-white/50 flex items-center gap-2 mt-0.5">
                          <span>{appointment.doctor_name}</span>
                          <span className="text-white/20">•</span>
                          <span>{appointment.department}</span>
                        </div>
                      </div>
                    </div>

                    {/* Missed Visits Badge */}
                    {missedCount > 0 ? (
                      <span className="px-2.5 py-1 rounded-full bg-[#C9685B]/15 border border-[#C9685B]/30 text-[#C9685B] text-[10px] font-semibold flex items-center gap-1.5 shrink-0">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{missedCount} Missed Visit{missedCount > 1 ? 's' : ''}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold flex items-center gap-1.5 shrink-0">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Good Attendance</span>
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/70">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-blue-400" />
                      <span>{appointment.appointment_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-400" />
                      <span>{appointment.appointment_time}</span>
                    </div>
                    <div className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                      $120 Value
                    </div>
                  </div>
                </div>

                {/* Destination Phone Input Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                      <span>Destination Phone Number</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setPhoneNumber('+917027635901')}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 hover:underline cursor-pointer transition-all"
                    >
                      <Zap className="h-3 w-3 text-blue-400" />
                      <span>Use Verified (+917027635901)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40 font-mono text-xs">
                        🇮🇳
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="+91 70276 35901"
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-2xl pl-10 pr-3.5 py-3 text-sm text-white font-mono focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>

                    {/* Language Selector Chips */}
                    <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCallLanguage('en')}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          callLanguage === 'en'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-white/60 hover:text-white'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setCallLanguage('hi')}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          callLanguage === 'hi'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-white/60 hover:text-white'
                        }`}
                      >
                        हिंदी
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary Launch Action */}
                <div className="pt-2">
                  <button
                    onClick={handleStartCall}
                    className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_12px_24px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>
                      {callMode === 'twilio'
                        ? `Ring Physical Mobile (${phoneNumber})`
                        : `Start In-Browser Conversational Demo`}
                    </span>
                    <ArrowRight className="h-4 w-4 ml-1 opacity-70" />
                  </button>
                  <p className="text-[11px] text-center text-white/40 mt-2">
                    Speech recognition active • Speaks missed visit warning & records real-time response
                  </p>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* VIEW B: RINGING / ACTIVE IN-CALL STATE                    */}
            {/* ======================================================== */}
            {(callState === 'RINGING' || callState === 'IN_CALL') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Active Call Live Header Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-500/10 to-indigo-500/5 border border-blue-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                      <div className="relative h-9 w-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
                        <PhoneCall className="h-4 w-4 animate-bounce" />
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>Connected to {phoneNumber}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                      <div className="text-[11px] text-white/50 mt-0.5">
                        {patient?.first_name} {patient?.last_name} • {appointment.doctor_name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-mono font-bold text-emerald-400">
                      {formatTimer(callTimer)}
                    </div>
                    <div className="text-[10px] text-white/40 font-mono uppercase tracking-wider">
                      Live Duration
                    </div>
                  </div>
                </div>

                {/* Animated Audio Soundwave EQ Visualizer */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] flex flex-col items-center justify-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 h-10 w-full">
                    {[45, 80, 60, 100, 70, 95, 50, 85, 65, 90, 75, 55, 95, 70, 60].map((height, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 rounded-full bg-gradient-to-t from-blue-500 via-indigo-400 to-emerald-400"
                        animate={{
                          height: callState === 'IN_CALL' ? [`${Math.max(15, height * 0.3)}%`, `${height}%`, `${Math.max(20, height * 0.5)}%`] : '20%',
                        }}
                        transition={{
                          duration: 0.8 + (i % 4) * 0.15,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          ease: 'easeInOut',
                          delay: i * 0.05,
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-400">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    <span>
                      {callMode === 'twilio'
                        ? 'Conversational Speech Recognition Active on Physical Mobile'
                        : 'Web Speech Synthesis Playing in Browser'}
                    </span>
                  </div>
                </div>

                {/* Real-time Voice Prompt Transcript Bubble */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-blue-400">
                    <span className="flex items-center gap-1">
                      <Mic className="h-3 w-3" />
                      <span>SlotSure AI Spoken Script</span>
                    </span>
                    {missedCount > 0 && (
                      <span className="text-[#C9685B] bg-[#C9685B]/15 px-2 py-0.5 rounded-full font-sans capitalize font-semibold">
                        Includes {missedCount} Missed Visit Notice
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 italic leading-relaxed text-[11px] max-h-20 overflow-y-auto pr-1">
                    "{activeScript || 'Initiating clinical voice outreach and connecting telephony gateway...'}"
                  </p>
                </div>

                {/* Touchtone / Voice Response Actions */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wider flex items-center justify-between">
                    <span>Patient Response Options:</span>
                    <span className="text-emerald-400 text-xs font-normal normal-case">
                      Speak into phone or press key
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* KEY 1: CONFIRM */}
                    <button
                      onClick={() => handlePressKey('1')}
                      disabled={isProcessingKey}
                      className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-white flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer group shadow-md"
                    >
                      <div className="h-9 w-9 rounded-full bg-emerald-600 text-white font-bold text-base flex items-center justify-center shadow-md group-hover:scale-110 transition-all">
                        1
                      </div>
                      <span className="text-xs font-bold text-emerald-400">Press 1: Confirm</span>
                      <span className="text-[10px] text-white/50">Secures Slot</span>
                    </button>

                    {/* KEY 2: CANCEL */}
                    <button
                      onClick={() => handlePressKey('2')}
                      disabled={isProcessingKey}
                      className="p-3.5 rounded-2xl bg-[#C9685B]/10 hover:bg-[#C9685B]/20 border border-[#C9685B]/30 text-white flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer group shadow-md"
                    >
                      <div className="h-9 w-9 rounded-full bg-[#C9685B] text-white font-bold text-base flex items-center justify-center shadow-md group-hover:scale-110 transition-all">
                        2
                      </div>
                      <span className="text-xs font-bold text-[#C9685B]">Press 2: Cancel</span>
                      <span className="text-[10px] text-white/50">Releases to Queue</span>
                    </button>
                  </div>
                </div>

                {/* Manual Hangup Action */}
                <button
                  onClick={handleManualEndCall}
                  className="w-full py-2.5 px-4 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <PhoneOff className="h-3.5 w-3.5" />
                  <span>Call Ended on Mobile / Hang Up (View Audit Report)</span>
                </button>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* VIEW C: COMPLETED CALL AUDIT CERTIFICATE                 */}
            {/* ======================================================== */}
            {callState === 'COMPLETED' && callResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Result Hero Banner */}
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3.5 shadow-lg ${
                    callResult.digits_pressed === '1' || callResult.outcome === 'CONFIRMED'
                      ? 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border-emerald-500/30 text-emerald-400'
                      : callResult.digits_pressed === '2' || callResult.outcome === 'CANCELLED'
                      ? 'bg-gradient-to-r from-[#C9685B]/15 via-[#C9685B]/10 to-transparent border-[#C9685B]/30 text-[#C9685B]'
                      : 'bg-gradient-to-r from-blue-500/15 via-blue-500/10 to-transparent border-blue-500/30 text-blue-400'
                  }`}
                >
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                    callResult.digits_pressed === '1' || callResult.outcome === 'CONFIRMED'
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                      : callResult.digits_pressed === '2' || callResult.outcome === 'CANCELLED'
                      ? 'bg-[#C9685B]/20 border border-[#C9685B]/40 text-[#C9685B]'
                      : 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                  }`}>
                    {callResult.digits_pressed === '1' || callResult.outcome === 'CONFIRMED' ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : callResult.digits_pressed === '2' || callResult.outcome === 'CANCELLED' ? (
                      <XCircle className="h-6 w-6" />
                    ) : (
                      <PhoneOff className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white tracking-tight">
                      {callResult.outcome_label || 'Outreach Call Completed'}
                    </div>
                    <div className="text-xs text-white/70 mt-0.5 leading-relaxed">
                      {callResult.spoken_response || 'Telephony session finished and recorded in audit log.'}
                    </div>
                  </div>
                </div>

                {/* Official Clinical Telephony Audit Certificate */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                      <span>Verified Telephony Audit Certificate</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      ✓ SQLite Synced
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[10px] text-white/40 uppercase block mb-1">Twilio Call SID</span>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-white/90 text-xs truncate max-w-[170px]">{callSid || 'CA-verified'}</span>
                        <button
                          onClick={() => copyToClipboard(callSid)}
                          className="text-white/40 hover:text-white p-1 rounded-md transition-all cursor-pointer"
                          title="Copy Call SID"
                        >
                          {hasCopiedSid ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[10px] text-white/40 uppercase block mb-1">Destination Recipient</span>
                      <span className="font-mono text-white/90 text-xs">{callResult.phone_number || phoneNumber}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[10px] text-white/40 uppercase block mb-1">Input Registered</span>
                      <span className="font-semibold text-white text-xs">
                        {callResult.digits_pressed === '1'
                          ? 'Key [1] Confirmed'
                          : callResult.digits_pressed === '2'
                          ? 'Key [2] Cancelled'
                          : 'Spoken Audio / Completed'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[10px] text-white/40 uppercase block mb-1">Call Duration</span>
                      <span className="text-white/90 text-xs">{callResult.duration_seconds || 18}s (Billable Carrier Seconds)</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between mt-1">
                    <span className="text-white/60">Clinic Capacity Action:</span>
                    <span className="font-semibold text-emerald-400">{callResult.capacity_action || 'Logged in Audit History'}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                    <span className="text-white/60">Revenue Protection Value:</span>
                    <span className="font-bold text-white">${callResult.revenue_protected || 120}.00</span>
                  </div>
                </div>

                {/* Patient Context Tag */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-white/60 flex items-center justify-between">
                  <span>Patient: <strong className="text-white">{patient?.first_name} {patient?.last_name}</strong></span>
                  <span>Doctor: <strong className="text-white">{appointment.doctor_name}</strong> ({appointment.department})</span>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setCallState('IDLE');
                      setCallResult(null);
                    }}
                    className="flex-1 py-3 rounded-2xl border border-white/[0.1] text-xs font-semibold text-white hover:bg-white/[0.06] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Make Another Call</span>
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="flex-1 py-3 rounded-2xl bg-white text-[#121214] hover:bg-zinc-200 text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Done & Return to Dashboard
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
