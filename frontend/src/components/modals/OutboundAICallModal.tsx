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
  X
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
  
  // Call Lifecycle States
  const [callState, setCallState] = useState<'IDLE' | 'RINGING' | 'IN_CALL' | 'COMPLETED'>('IDLE');
  const [callTimer, setCallTimer] = useState<number>(0);
  const [activeScript, setActiveScript] = useState<string>('');
  const [callSid, setCallSid] = useState<string>('');
  const [callResult, setCallResult] = useState<any>(null);
  const [isProcessingKey, setIsProcessingKey] = useState<boolean>(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<any>(null);
  const ringAudioRef = useRef<any>(null);

  // Initialize phone number from patient record
  useEffect(() => {
    if (appointment?.patient?.phone) {
      setPhoneNumber(appointment.patient.phone);
    } else {
      setPhoneNumber('+91 98765 43210');
    }
    setCallState('IDLE');
    setCallTimer(0);
    setCallResult(null);
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
    setCallState('RINGING');
    setCallTimer(0);

    try {
      const resp = await api.initiateOutboundCall({
        appointment_id: appointment.id,
        phone_number: phoneNumber,
        mode: callMode,
        language: callLanguage,
      });

      setCallSid(resp.call_sid);
      setActiveScript(resp.script);

      // Ring for 3 seconds then connect
      setTimeout(() => {
        setCallState('IN_CALL');
        
        // Start duration timer
        timerRef.current = setInterval(() => {
          setCallTimer(prev => prev + 1);
        }, 1000);

        // Speak the professional IVR prompt out loud
        speakIVR(resp.script, callLanguage);
      }, 2500);

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

    // Play DTMF tone feedback
    playTone(digit === '1' ? 697 : 770);

    try {
      const result = await api.recordCallResult({
        appointment_id: appointment.id,
        phone_number: phoneNumber,
        digits_pressed: digit,
        duration_seconds: callTimer || 28,
        notes: `Outbound AI Call: Patient selected Key [${digit}]`,
      });

      setCallResult(result);
      setCallState('COMPLETED');
      clearInterval(timerRef.current);

      // Speak confirmation feedback
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

  // Simple Web Audio DTMF beep
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
    } catch (e) {
      // AudioContext unavailable
    }
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-lg bg-[#121214] text-white rounded-3xl border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col relative"
        >
          {/* Top Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-36 bg-blue-500/10 blur-[80px] pointer-events-none rounded-full" />

          {/* Header */}
          <div className="pt-6 pb-4 px-6 border-b border-white/[0.08] flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <PhoneForwarded className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Outbound AI Confirmation Call
                </h3>
                <p className="text-[11px] text-white/50">
                  IVR Touchtone Confirmation with Missed Visit Advisory
                </p>
              </div>
            </div>

            <button
              onClick={handleEndCall}
              className="h-8 w-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/60 hover:text-white transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5">
            {/* 1. Phone Number Input & Target Appointment Info */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-white/50 mb-1.5">
                  Dial Mobile Number (Editable)
                </label>
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

              {/* Appointment & Missed Visits Card */}
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

                {/* Missed Visits Tag */}
                {missedCount > 0 ? (
                  <div className="px-2.5 py-1 rounded-full bg-[#C9685B]/15 border border-[#C9685B]/30 text-[#C9685B] text-[10px] font-semibold flex items-center gap-1 whitespace-nowrap">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{missedCount} Missed Visit{missedCount > 1 ? 's' : ''}</span>
                  </div>
                ) : (
                  <div className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold flex items-center gap-1 whitespace-nowrap">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Good Attendance</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. CALL STATE DISPLAY */}

            {/* A. IDLE STATE: Trigger Call Button */}
            {callState === 'IDLE' && (
              <div className="pt-2">
                <button
                  onClick={handleStartCall}
                  className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Initiate AI Phone Call to {phoneNumber}</span>
                </button>
                <p className="text-[11px] text-center text-white/40 mt-2">
                  Speaks professional clinical IVR notice & listens for Touchtone Key 1 or 2
                </p>
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
                  <div className="text-sm font-bold text-white">Ringing {phoneNumber}...</div>
                  <div className="text-xs text-blue-400 mt-0.5">Connecting SlotSure IVR Gateway</div>
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
                    <span>IVR Speaking</span>
                  </div>
                </div>

                {/* Spoken Script Box */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-white/80 leading-relaxed max-h-24 overflow-y-auto">
                  <span className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold block mb-1">
                    Automated Voice Prompt:
                  </span>
                  <p className="italic">"{activeScript}"</p>
                </div>

                {/* Touchtone Interactive Buttons (Key 1 & Key 2) */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2 flex items-center justify-between">
                    <span>Patient Touchtone Response:</span>
                    <span className="text-emerald-400 font-sans normal-case">Click button or press 1 / 2</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* BUTTON 1: CONFIRM */}
                    <button
                      onClick={() => handlePressKey('1')}
                      disabled={isProcessingKey}
                      className="p-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-white flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all group shadow-md"
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
                      className="p-4 rounded-2xl bg-[#C9685B]/20 hover:bg-[#C9685B]/30 border border-[#C9685B]/40 text-white flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all group shadow-md"
                    >
                      <div className="h-10 w-10 rounded-full bg-[#C9685B] text-white font-bold text-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-all">
                        2
                      </div>
                      <span className="text-xs font-bold text-[#C9685B]">Press 2: Cancel</span>
                      <span className="text-[10px] text-white/60">Release Slot to Queue</span>
                    </button>
                  </div>
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
                    <span className="text-white/60">DTMF Response:</span>
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
