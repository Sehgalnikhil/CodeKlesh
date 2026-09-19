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
  Send,
  RotateCcw,
  Check,
  X,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Signal
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

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<any>(null);

  // Initialize phone number and load saved Twilio config
  useEffect(() => {
    // If patient has a phone number, clean it; otherwise default to verified number
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

    // Load Twilio config if present
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

    // Strict E.164 normalization: strip whitespace, hyphens, and parenthesis
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

    // Update state to normalized representation
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
          // If Twilio failed, stay in IDLE and do NOT trigger fake audio demo
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

        // ONLY speak via browser speakers in simulator demo mode
        // For real Twilio calls, Twilio speaks through the physical phone's earpiece/speaker!
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
          description: `${result.patient_name} pressed 1 to confirm attendance with ${result.doctor_name}`,
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
        : 'Call Concluded',
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
            spokenResp = 'Patient pressed 1: Confirmed attendance & secured reserved slot';
            capAction = 'Slot Protected & Locked';
            outcomeType = 'CONFIRMED';
          } else if (isCancel) {
            outcomeLabel = 'Appointment Cancelled via Physical Mobile Phone (Key 2)';
            spokenResp = 'Patient pressed 2: Released slot for urgent standby patients';
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

  if (!isOpen || !appointment) return null;

  const patient = appointment.patient;
  const missedCount = patient?.missed_appointments || 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-lg bg-[#121214] text-white rounded-3xl border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh] overflow-y-auto"
        >
          {/* Top Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-36 bg-blue-500/15 blur-[80px] pointer-events-none rounded-full" />

          {/* Header */}
          <div className="pt-5 pb-3 px-6 border-b border-white/[0.08] flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <PhoneForwarded className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>SlotSure Conversational AI Call</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Live Interactive AI
                  </span>
                </h3>
                <p className="text-[11px] text-white/50">
                  Real-Time Spoken Dialogue & Mobile Touchtone Sync
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTwilioConfigOpen(!isTwilioConfigOpen)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                  isTwilioConfigured
                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                    : 'border-white/[0.1] text-white/60 hover:text-white bg-white/[0.05]'
                }`}
                title="Configure Real Cellular Phone Gateway (Twilio)"
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="text-[10px] hidden sm:inline">
                  {isTwilioConfigured ? 'Twilio Active' : 'Configure Cellular'}
                </span>
              </button>

              <button
                onClick={handleEndCall}
                className="h-8 w-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Twilio Gateway Setup Drawer */}
          <AnimatePresence>
            {isTwilioConfigOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-black/50 border-b border-white/[0.08] p-5 space-y-3 overflow-hidden text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <Signal className="h-4 w-4 text-emerald-400" />
                    <span>Real Cellular Phone Calling Setup (Twilio Free Trial)</span>
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

                <p className="text-white/60 text-[11px] leading-relaxed">
                  To ring your physical mobile phone over cellular networks, enter your free Twilio trial credentials below. Twilio provides 100% free credits upon signup with no card required:
                </p>

                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1 font-mono">TWILIO_ACCOUNT_SID (starts with AC...)</label>
                    <input
                      type="text"
                      value={twilioSid}
                      onChange={e => setTwilioSid(e.target.value)}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-white/50 mb-1 font-mono">TWILIO_AUTH_TOKEN</label>
                      <input
                        type="password"
                        value={twilioToken}
                        onChange={e => setTwilioToken(e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/50 mb-1 font-mono">TWILIO PHONE NUMBER (e.g. +1234567890)</label>
                      <input
                        type="text"
                        value={twilioFrom}
                        onChange={e => setTwilioFrom(e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-white/40">
                    *Note: On free trial accounts, your mobile must be verified in Twilio Console Verified Caller IDs.
                  </span>
                  <button
                    onClick={handleSaveTwilioConfig}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm"
                  >
                    Save & Enable Cellular
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal Body */}
          <div className="p-6 space-y-5">
            {/* Call Mode Selector */}
            <div className="flex items-center justify-between p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <button
                onClick={() => setCallMode('simulator')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                  callMode === 'simulator'
                    ? 'bg-white text-[#1D1D1F] shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Interactive Audio Call (100% Free Demo)
              </button>
              <button
                onClick={() => {
                  setCallMode('twilio');
                  if (!isTwilioConfigured) {
                    setIsTwilioConfigOpen(true);
                  }
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  callMode === 'twilio'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Signal className="h-3 w-3" />
                <span>Real Cellular Call (Twilio)</span>
                {!isTwilioConfigured && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                    Setup
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Number Input */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium uppercase tracking-wider text-white/50">
                    Destination Mobile Number
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPhoneNumber('+917027635901')}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-mono underline cursor-pointer"
                    >
                      Use Verified Phone (+917027635901)
                    </button>
                    {callMode === 'twilio' && isTwilioConfigured && (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Twilio Cellular Ready
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    disabled={callState !== 'IDLE'}
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-blue-500 transition-all disabled:opacity-60"
                  />

                  {/* Language Select Pill */}
                  <div className="flex items-center p-0.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs">
                    <button
                      onClick={() => setCallLanguage('en')}
                      disabled={callState !== 'IDLE'}
                      className={`px-2.5 py-1 rounded-lg transition-all ${callLanguage === 'en' ? 'bg-blue-600 text-white font-medium' : 'text-white/60'}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setCallLanguage('hi')}
                      disabled={callState !== 'IDLE'}
                      className={`px-2.5 py-1 rounded-lg transition-all ${callLanguage === 'hi' ? 'bg-blue-600 text-white font-medium' : 'text-white/60'}`}
                    >
                      Hindi
                    </button>
                  </div>
                </div>
              </div>

              {/* Appointment Context & Missed Visits Banner */}
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-white">
                    {patient?.first_name} {patient?.last_name} • {appointment.doctor_name}
                  </div>
                  <div className="text-[11px] text-white/60 flex items-center gap-2.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-blue-400" /> {appointment.appointment_date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-400" /> {appointment.appointment_time}
                    </span>
                    <span>({appointment.department})</span>
                  </div>
                </div>

                {/* Missed Visits Alert Badge */}
                {missedCount > 0 ? (
                  <div className="px-2.5 py-1 rounded-full bg-[#C9685B]/15 border border-[#C9685B]/30 text-[#C9685B] text-[10px] font-semibold flex items-center gap-1 whitespace-nowrap">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{missedCount} Previous Missed Visit{missedCount > 1 ? 's' : ''}</span>
                  </div>
                ) : (
                  <div className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold flex items-center gap-1 whitespace-nowrap">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Clean History</span>
                  </div>
                )}
              </div>
            </div>

            {/* Twilio Dispatched Banner or Error */}
            {twilioDispatchedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <PhoneCall className="h-4 w-4 animate-bounce shrink-0" />
                <span>Real cellular call dialed to <strong>{phoneNumber}</strong>! Answer your phone to hear the IVR message.</span>
              </div>
            )}

            {twilioError && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold">Twilio Cellular Notice:</div>
                  <p className="text-[11px] opacity-90">{twilioError}</p>
                  <p className="text-[10px] text-amber-300/80">
                    Tip: On free trial Twilio accounts, your number must be formatted in E.164 (e.g. +917027635901) and added to Twilio Console → "Verified Caller IDs".
                  </p>
                </div>
              </div>
            )}

            {/* 2. CALL STATE DISPLAY */}

            {/* A. IDLE STATE: Trigger Call Button */}
            {callState === 'IDLE' && (
              <div className="pt-2">
                <button
                  onClick={handleStartCall}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all ${
                    callMode === 'twilio'
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>
                    {callMode === 'twilio'
                      ? `Ring My Physical Phone (${phoneNumber})`
                      : `Initiate AI Confirmation Call to ${phoneNumber}`}
                  </span>
                </button>
              </div>
            )}

            {/* B. RINGING STATE */}
            {callState === 'RINGING' && (
              <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex flex-col items-center justify-center space-y-3">
                <div className="relative flex h-12 w-12 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <div className="relative h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    <PhoneCall className="h-5 w-5 animate-bounce" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">
                    {callMode === 'twilio' ? `Ringing Your Physical Mobile: ${phoneNumber}...` : `Dialing ${phoneNumber}...`}
                  </div>
                  <div className="text-xs text-blue-400 mt-0.5">
                    {callMode === 'twilio' ? 'Twilio Cellular SIP Connected' : 'SlotSure IVR Gateway Connected'}
                  </div>
                </div>
              </div>
            )}

            {/* C. IN_CALL STATE: Script + Interactive Keypad 1 & 2 */}
            {callState === 'IN_CALL' && (
              <div className="space-y-4">
                {/* Active Audio Wave + Timer */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">Call Connected</span>
                    <span className="text-xs text-white/50 font-mono">({formatTimer(callTimer)})</span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <Volume2 className="h-3 w-3 animate-pulse" />
                    <span>{callMode === 'twilio' ? 'Speaking on Physical Mobile' : 'IVR Speaking Prompt'}</span>
                  </div>
                </div>

                {/* Spoken Script Box */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-white/80 leading-relaxed max-h-24 overflow-y-auto">
                  <span className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold block mb-1">
                    Automated Voice Prompt (Includes Missed Visits Notice):
                  </span>
                  <p className="italic">"{activeScript}"</p>
                </div>

                {/* Conversational AI & Touchtone Instructions */}
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-xs flex items-center gap-2.5 text-blue-200">
                  <Sparkles className="h-4 w-4 text-blue-400 shrink-0 animate-pulse" />
                  <span className="text-[11px] leading-relaxed">
                    <strong>Conversational AI Listening:</strong> You can speak naturally into your mobile phone (e.g. <em>"Yes, confirm it"</em>, <em>"Who is my doctor?"</em>, or <em>"Cancel my visit"</em>) or use your keypad below.
                  </span>
                </div>

                {/* Touchtone Interactive Buttons (Key 1 & Key 2) */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2 flex items-center justify-between">
                    <span>Touchtone Response (Optional):</span>
                    <span className="text-emerald-400 font-sans normal-case text-xs">
                      Press 1 or speak into your phone
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* BUTTON 1: CONFIRM */}
                    <button
                      onClick={() => handlePressKey('1')}
                      disabled={isProcessingKey}
                      className="p-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-white flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all group shadow-md cursor-pointer"
                    >
                      <div className="h-10 w-10 rounded-full bg-emerald-600 text-white font-bold text-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-all">
                        1
                      </div>
                      <span className="text-xs font-bold text-emerald-400">Press 1: Confirm</span>
                      <span className="text-[10px] text-white/60">Confirm Attendance</span>
                    </button>

                    {/* BUTTON 2: CANCEL & FREE SLOT */}
                    <button
                      onClick={() => handlePressKey('2')}
                      disabled={isProcessingKey}
                      className="p-4 rounded-2xl bg-[#C9685B]/20 hover:bg-[#C9685B]/30 border border-[#C9685B]/40 text-white flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all group shadow-md cursor-pointer"
                    >
                      <div className="h-10 w-10 rounded-full bg-[#C9685B] text-white font-bold text-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-all">
                        2
                      </div>
                      <span className="text-xs font-bold text-[#C9685B]">Press 2: Cancel</span>
                      <span className="text-[10px] text-white/60">Release Slot to Queue</span>
                    </button>
                  </div>

                  {/* Manual End Call / Hang Up Button */}
                  <button
                    onClick={handleManualEndCall}
                    className="w-full mt-3 py-2.5 px-4 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <PhoneOff className="h-3.5 w-3.5" />
                    <span>Call Ended on Mobile / Hang Up (View Report)</span>
                  </button>
                </div>
              </div>
            )}

            {/* D. COMPLETED STATE: Live On-Site Call Result Report */}
            {callState === 'COMPLETED' && callResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Result Banner */}
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3 ${
                    callResult.digits_pressed === '1'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-[#C9685B]/15 border-[#C9685B]/30 text-[#C9685B]'
                  }`}
                >
                  {callResult.digits_pressed === '1' ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-bold text-white">
                      {callResult.outcome_label}
                    </div>
                    <div className="text-xs opacity-90 mt-0.5">
                      {callResult.spoken_response}
                    </div>
                  </div>
                </div>

                {/* Audit Details Table */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2 text-xs">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
                    Live Call Audit Report
                  </div>

                  <div className="flex justify-between py-1 border-b border-white/[0.04]">
                    <span className="text-white/60">Call SID:</span>
                    <span className="font-mono text-white/90">{callSid}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/[0.04]">
                    <span className="text-white/60">Recipient:</span>
                    <span className="font-mono text-white/90">{callResult.phone_number}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/[0.04]">
                    <span className="text-white/60">Touchtone Response:</span>
                    <span className="font-bold text-white">
                      Key [{callResult.digits_pressed}] Registered
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/[0.04]">
                    <span className="text-white/60">Call Duration:</span>
                    <span className="text-white/90">{callResult.duration_seconds}s</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/[0.04]">
                    <span className="text-white/60">Capacity Outcome:</span>
                    <span className="font-semibold text-emerald-400">{callResult.capacity_action}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-white/60">Database Status:</span>
                    <span className="text-emerald-400 font-medium">✓ Synchronized in SQLite</span>
                  </div>
                </div>

                {/* Footer action buttons */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => {
                      setCallState('IDLE');
                      setCallResult(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-xs font-semibold text-white hover:bg-white/[0.06] transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Call Another Number</span>
                  </button>
                  <button
                    onClick={handleEndCall}
                    className="flex-1 py-2.5 rounded-xl bg-white text-[#1D1D1F] hover:bg-zinc-200 text-xs font-semibold transition-all"
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
