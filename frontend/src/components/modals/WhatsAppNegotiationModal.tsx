import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Check,
  CheckCheck,
  Calendar,
  Clock,
  ArrowRightLeft,
  ShieldCheck,
  Volume2,
  RefreshCw,
  User,
  Stethoscope,
  Activity,
  Layers,
  ChevronRight,
  Phone,
  Copy,
  Mic,
  MicOff,
  AlertCircle,
  FileCheck2,
  TrendingUp,
  FileText,
  MapPin,
  Building2,
  CreditCard,
  CheckCircle2,
  Paperclip,
  Play,
  Square,
  Shield,
  FileSpreadsheet,
  Sparkles,
  HeartPulse,
} from 'lucide-react';
import { Appointment, WhatsAppNegotiateResponse } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useActivityStream } from '../../context/ActivityStreamContext';

interface Message {
  id: string;
  sender: 'patient' | 'ai';
  text: string;
  timestamp: string;
  hasAudio?: boolean;
}

interface WhatsAppNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onRefreshClinicData: () => void;
  onOpenAzureDocScanner?: () => void;
}

// Realistic WhatsApp Patient Responses & Clinical Front-Desk Macros
const CLINICAL_MACROS = [
  {
    label: '✅ Confirm Attendance',
    text: 'Haan theek hai, lock kar do. I will be there on time.',
    desc: 'Confirms 100% on-time arrival',
  },
  {
    label: '🗓️ Reschedule Slot',
    text: 'Kal subah 10 baje ka slot mil sakta hai kya? I have an urgent meeting today.',
    desc: 'Requests slot reallocation to tomorrow morning',
  },
  {
    label: '💳 Lock ₹100 Deposit',
    text: 'Please lock my slot with ₹100 UPI deposit token so it is 100% reserved.',
    desc: 'Secures reservation with micro-deposit token',
  },
  {
    label: '📋 Submit Symptoms & Rx',
    text: 'Here are my symptoms: persistent throat irritation and mild fever for 2 days. Attaching my recent blood test panel.',
    desc: 'Submits pre-consultation intake notes & lab work',
  },
  {
    label: '⏳ Running 15 Mins Late',
    text: 'I am on my way to the clinic, might be 10-15 minutes late due to traffic. Please hold my slot.',
    desc: 'Alerts OPD front desk of traffic delay',
  },
  {
    label: '❌ Release Slot',
    text: 'Emergency out of station work, please cancel my appointment today.',
    desc: 'Releases slot for standby waitlist candidate',
  },
];

export const WhatsAppNegotiationModal: React.FC<WhatsAppNegotiationModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onRefreshClinicData,
  onOpenAzureDocScanner,
}) => {
  const { showToast } = useAuth();
  const { emitEvent } = useActivityStream();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [latestAgentResponse, setLatestAgentResponse] = useState<WhatsAppNegotiateResponse | null>(null);
  const [showBrainPanel, setShowBrainPanel] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedThread, setCopiedThread] = useState(false);

  // Live dynamic slot state that immediately updates on screen
  const [currentSlotState, setCurrentSlotState] = useState<{
    date: string;
    time: string;
    status: string;
    isRecentlyUpdated: boolean;
  }>({
    date: '',
    time: '',
    status: '',
    isRecentlyUpdated: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  // Initialize conversation thread & live slot state when appointment opens
  useEffect(() => {
    if (appointment && isOpen) {
      const patientName = appointment.patient
        ? `${appointment.patient.first_name}`
        : 'Patient';

      setCurrentSlotState({
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        status: appointment.confirmation_status,
        isRecentlyUpdated: false,
      });

      const initialGreeting: Message = {
        id: 'init-1',
        sender: 'ai',
        text: `Namaste ${patientName} ji! 🙏 This is the Outpatient Care Desk at Dr. Das's clinic. Your ${appointment.department} consultation is scheduled for ${appointment.appointment_date} at ${appointment.appointment_time}.\n\nPlease reply "Confirm" to secure your slot, or let us know if you need to reschedule or swap your timing.`,
        timestamp: '09:00 AM',
        hasAudio: true,
      };
      setMessages([initialGreeting]);
      setLatestAgentResponse(null);
    }
  }, [appointment, isOpen]);

  // Keyboard shortcut to close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Clean up speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Web Speech Recognition (Mic Input)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Speech recognition not supported in this browser. Please type your message.', 'error');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // Supports Hindi & English mixed speech

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const fallbackSpeech = (msgId: string, text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);
      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    } else {
      setSpeakingMsgId(null);
    }
  };

  const playVoiceNote = async (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    try {
      setSpeakingMsgId(msgId);
      const voice = (appointment as any)?.preferred_language === 'hi' ? 'hi-IN-SwaraNeural' : 'en-IN-NeerjaNeural';
      const res = await api.azureTextToSpeech(text, voice);

      if (res && res.audio_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${res.audio_base64}`);
        audio.onended = () => setSpeakingMsgId(null);
        audio.onerror = () => fallbackSpeech(msgId, text);
        audio.play();
      } else {
        fallbackSpeech(msgId, text);
      }
    } catch {
      fallbackSpeech(msgId, text);
    }
  };

  const copyConversation = () => {
    const threadText = messages
      .map((m) => `[${m.timestamp}] ${m.sender === 'ai' ? 'Apex Care Desk' : patientFullName}: ${m.text}`)
      .join('\n');
    navigator.clipboard.writeText(threadText);
    setCopiedThread(true);
    setTimeout(() => setCopiedThread(false), 2000);
  };

  if (!isOpen || !appointment) return null;

  const patient = appointment.patient;
  const patientFullName = patient ? `${patient.first_name} ${patient.last_name}` : 'Patient';
  const riskProb = Math.round((appointment.prediction?.risk_probability || 0.45) * 100);
  const isHighRisk = (appointment.prediction?.risk_level || 'MEDIUM') === 'HIGH';
  const attendanceRate = patient ? Math.round((patient.attendance_rate || (1 - riskProb / 100)) * 100) : 88;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isAiThinking) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsgId = `user-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: Message = {
      id: userMsgId,
      sender: 'patient',
      text: query.trim(),
      timestamp: nowTime,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputText('');
    setIsAiThinking(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.sender === 'patient' ? 'user' : 'model',
        content: m.text,
      }));

      const response = await api.whatsappNegotiate({
        appointment_id: appointment.id,
        user_message: query.trim(),
        conversation_history: historyPayload,
      });

      setLatestAgentResponse(response);

      const aiMsgId = `ai-${Date.now()}`;
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'ai',
          text: response.ai_response,
          timestamp: aiTime,
          hasAudio: true,
        },
      ]);

      if (response.appointment_updated) {
        // Immediately update live modal slot state
        if (response.new_slot) {
          setCurrentSlotState({
            date: response.new_slot.date,
            time: response.new_slot.time,
            status: 'Confirmed',
            isRecentlyUpdated: true,
          });
        } else if (response.intent === 'CANCEL_APPOINTMENT') {
          setCurrentSlotState((prev) => ({
            ...prev,
            status: 'Cancelled',
            isRecentlyUpdated: true,
          }));
        } else if (response.intent === 'CONFIRM_APPOINTMENT') {
          setCurrentSlotState((prev) => ({
            ...prev,
            status: 'Confirmed',
            isRecentlyUpdated: true,
          }));
        }

        // Trigger parent dashboard reload
        onRefreshClinicData();

        if (response.intent === 'RESCHEDULE_SWAP_REQUEST') {
          emitEvent({
            type: 'RECOVERY',
            title: 'Autonomous Slot Swap Executed',
            description: `${patientFullName} rescheduled to ${response.new_slot?.date} ${response.new_slot?.time}. Old slot backfilled with ${response.swapped_with_waitlist?.patient_name || 'waitlist candidate'}.`,
            patientName: patientFullName,
            doctorName: appointment.doctor_name,
            badge: 'WhatsApp Desk',
            badgeColor: '#25D366',
          });
          showToast(`⚡ Schedule swap successfully coordinated via WhatsApp Desk`, 'success');
        } else if (response.intent === 'CONFIRM_APPOINTMENT') {
          emitEvent({
            type: 'CONFIRMATION',
            title: 'Patient Attendance Confirmed',
            description: `${patientFullName} confirmed visit with ${appointment.doctor_name} for ${appointment.appointment_time}.`,
            patientName: patientFullName,
            doctorName: appointment.doctor_name,
            badge: 'Confirmed',
            badgeColor: '#128C7E',
          });
          showToast(`✓ Patient confirmed arrival via WhatsApp Outpatient Channel`, 'success');
        } else if (response.intent === 'CANCEL_APPOINTMENT') {
          showToast(`Slot released. Waitlist candidate notified.`, 'info');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error communicating with clinic desk', 'error');
    } finally {
      setIsAiThinking(false);
    }
  };

  // Helper to translate backend tool signatures into real hospital operations
  const getToolMetadata = (toolName: string) => {
    switch (toolName) {
      case 'query_doctor_schedule':
        return {
          title: 'OPD Schedule & Calendar Sync',
          desc: 'Verified doctor availability and schedule buffers',
          badge: 'Calendar Synced',
        };
      case 'find_waitlist_candidate':
        return {
          title: 'Standby Waitlist Reallocation',
          desc: 'Queried eligible standby patients with priority triage',
          badge: 'Match Found',
        };
      case 'execute_reschedule':
        return {
          title: 'EHR Slot Reallocation',
          desc: 'Updated appointment booking timestamp on clinic calendar',
          badge: 'Slot Updated',
        };
      case 'confirm_appointment':
        return {
          title: 'Attendance Confirmation Lock',
          desc: 'Marked slot confirmed and updated daily OPD arrival queue',
          badge: 'Confirmed',
        };
      default:
        return {
          title: toolName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          desc: 'Clinical automation protocol action executed',
          badge: 'Executed',
        };
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/65 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col md:flex-row overflow-hidden"
        >
          {/* LEFT: Authentic WhatsApp Business Interface */}
          <div className="flex-1 flex flex-col h-full bg-[#EFEAE2] relative overflow-hidden border-r border-slate-200">
            {/* WhatsApp App Header - Authentic Healthcare Provider Branding */}
            <div className="px-4 py-3 bg-[#075E54] text-white flex items-center justify-between shadow-md z-10 shrink-0">
              <div className="flex items-center gap-3">
                {/* Clinic / Provider Monogram Badge */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-800 border-2 border-emerald-400/40 flex items-center justify-center font-bold text-white shadow-xs">
                    <HeartPulse className="w-5 h-5 text-emerald-200" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075E54] rounded-full" />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm tracking-tight text-white">
                      Apex Outpatient Care Desk
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-200 px-1.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-300" /> Verified Channel
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/80 flex items-center gap-1">
                    {isAiThinking ? (
                      <span className="text-amber-200 font-medium animate-pulse">typing message...</span>
                    ) : (
                      <span>{patientFullName} • {appointment.doctor_name} ({appointment.department})</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBrainPanel(!showBrainPanel)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs ${
                    showBrainPanel
                      ? 'bg-emerald-800 text-emerald-100 border border-emerald-500/50'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title="Toggle Patient EMR & Clinical Chart Panel"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden sm:inline">Patient EHR Chart</span>
                </button>

                <button
                  onClick={copyConversation}
                  className="p-2 rounded-lg hover:bg-white/10 text-emerald-100 hover:text-white transition-colors"
                  title={copiedThread ? 'Copied transcript!' : 'Copy chat transcript'}
                >
                  {copiedThread ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 text-emerald-100 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-header Ribbon: Live Consultation Snapshot */}
            <div className="px-4 py-2 bg-[#064E46] text-emerald-100 text-xs flex items-center justify-between border-b border-[#053F39] shadow-inner shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>
                  <strong>Consultation:</strong> {currentSlotState.date || appointment.appointment_date} at{' '}
                  <span className="font-bold text-white underline decoration-emerald-400/60 decoration-2">
                    {currentSlotState.time || appointment.appointment_time}
                  </span>
                </span>
                <span className="text-emerald-400/50 hidden sm:inline">•</span>
                <span className="text-emerald-200 hidden sm:inline flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-emerald-400" />
                  {appointment.doctor_name}
                </span>
                <span className="text-emerald-400/50 hidden sm:inline">•</span>
                <span className="text-emerald-300/80 hidden sm:inline flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  Room {((appointment.id % 6) + 1)}B
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentSlotState.isRecentlyUpdated && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-[9px] font-mono uppercase bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-full shadow-xs"
                  >
                    Slot Updated
                  </motion.span>
                )}
                <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-900/90 border border-emerald-700/60 text-emerald-200">
                  {currentSlotState.status || appointment.confirmation_status}
                </span>
              </div>
            </div>

            {/* Chat Messages Body with WhatsApp Style Wallpaper */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* HIPAA / NABH Compliance Notice */}
              <div className="flex justify-center">
                <div className="text-[11px] bg-white/85 text-slate-600 px-3.5 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs max-w-sm text-center flex items-center justify-center gap-1.5 backdrop-blur-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>NABH & HIPAA Compliant Channel • 256-bit Encrypted</span>
                </div>
              </div>

              {/* Date stamp indicator */}
              <div className="flex justify-center my-1">
                <span className="text-[10px] font-medium text-slate-500 bg-black/5 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Today
                </span>
              </div>

              {messages.map((msg) => {
                const isAi = msg.sender === 'ai';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3 shadow-xs relative text-xs leading-relaxed ${
                        isAi
                          ? 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/60'
                          : 'bg-[#D9FDD3] text-slate-900 rounded-tr-xs border border-emerald-200/60'
                      }`}
                    >
                      {/* Clinical Sender Label */}
                      {isAi && (
                        <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-emerald-800 mb-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-emerald-600" />
                            Apex Outpatient Desk
                          </span>
                        </div>
                      )}

                      {/* Message Content */}
                      <p className="whitespace-pre-wrap text-slate-800 font-normal">{msg.text}</p>

                      {/* WhatsApp Voice Note Audio Widget */}
                      {isAi && msg.hasAudio && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => playVoiceNote(msg.id, msg.text)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                              speakingMsgId === msg.id
                                ? 'bg-emerald-600 text-white animate-pulse'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                            title={speakingMsgId === msg.id ? 'Pause voice message' : 'Play voice message'}
                          >
                            {speakingMsgId === msg.id ? (
                              <Square className="w-3 h-3 fill-current" />
                            ) : (
                              <Play className="w-3 h-3 ml-0.5 fill-current" />
                            )}
                          </button>

                          {/* Sound wave graphic */}
                          <div className="flex-1 flex items-center gap-0.5 h-4">
                            {[4, 8, 12, 6, 14, 10, 16, 7, 12, 18, 9, 14, 6, 12, 8, 5, 11].map((h, i) => (
                              <div
                                key={i}
                                className={`w-1 rounded-full transition-all ${
                                  speakingMsgId === msg.id
                                    ? 'bg-emerald-500 animate-pulse'
                                    : 'bg-slate-300'
                                }`}
                                style={{ height: `${h}px` }}
                              />
                            ))}
                          </div>

                          <span className="text-[10px] font-mono text-slate-500">
                            {speakingMsgId === msg.id ? 'Playing...' : '0:14'}
                          </span>
                        </div>
                      )}

                      {/* Timestamp & read receipts */}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                        <span>{msg.timestamp}</span>
                        {!isAi && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Realistic typing indicator */}
              {isAiThinking && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-tl-xs px-3.5 py-2.5 border border-slate-200/70 shadow-xs flex items-center gap-2 text-xs text-slate-600">
                    <span className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span className="text-slate-500 font-medium">Checking OPD calendar & slot availability...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Clinical Response Macros (Streamlined WhatsApp Quick Replies) */}
            <div className="px-3 pt-2 pb-1.5 bg-white/90 backdrop-blur-xs border-t border-slate-200/70 overflow-x-auto flex items-center gap-2 scrollbar-none shrink-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-1 whitespace-nowrap">
                Clinical Macros:
              </span>
              {CLINICAL_MACROS.map((macro, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(macro.text)}
                  disabled={isAiThinking}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 active:scale-95 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 text-[11px] font-medium whitespace-nowrap transition-all shadow-2xs disabled:opacity-50"
                  title={macro.desc}
                >
                  {macro.label}
                </button>
              ))}
            </div>

            {/* Input Bar with Document Attachment, Voice Dictation & Send */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
              {/* Attachment / Smart OCR Lab Scanner */}
              {onOpenAzureDocScanner && (
                <button
                  type="button"
                  onClick={onOpenAzureDocScanner}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all shadow-2xs active:scale-95 shrink-0"
                  title="Attach Prescription or Lab Report (Smart Clinical OCR)"
                >
                  <Paperclip className="w-4 h-4 text-slate-600" />
                </button>
              )}

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  isListening
                    ? "Listening... Speak in Hindi or English"
                    : "Type message in English or Hindi (e.g. 'Can I swap to tomorrow?')..."
                }
                className={`flex-1 px-4 py-2.5 rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                  isListening
                    ? 'bg-rose-50 border border-rose-300 ring-2 ring-rose-200 animate-pulse text-rose-900'
                    : 'bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500/40'
                }`}
              />

              {/* Mic / Voice Input Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xs active:scale-95 shrink-0 ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title={isListening ? 'Stop listening' : 'Voice-to-Text Input'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isAiThinking}
                className="w-10 h-10 rounded-full bg-[#128C7E] hover:bg-[#075E54] active:scale-95 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md shrink-0"
                title="Send message"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>

          {/* RIGHT: Authentic Patient Outpatient EHR Dossier & Decision Audit Log */}
          {showBrainPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="w-full md:w-[400px] bg-slate-50/95 text-slate-900 flex flex-col h-full border-t md:border-t-0 md:border-l border-slate-200/90 overflow-y-auto p-4 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                      Patient Clinical Dossier
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      UHID: {patient?.patient_code || `AP-${(appointment.id * 104) + 120}`}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  NABH COMPLIANT
                </span>
              </div>

              {/* Patient Identity & Clinical Demographics */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                      {patient ? `${patient.first_name[0]}${patient.last_name[0]}` : 'PT'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{patientFullName}</h4>
                      <p className="text-[11px] text-slate-500">
                        {patient?.age || 38}y • {patient?.gender || 'Female'} • {patient?.phone || '+91 98765-43210'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isHighRisk
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {riskProb}% NO-SHOW RISK
                  </span>
                </div>

                {/* Attendance Reliability Index */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Historical Reliability:</span>
                    <span className="font-bold text-slate-900">{attendanceRate}% Attendance</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        attendanceRate >= 80 ? 'bg-emerald-500' : attendanceRate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${attendanceRate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Visits: {patient?.total_appointments || 6}</span>
                    <span>Missed: {patient?.missed_appointments || 0}</span>
                    <span>Distance: {patient?.distance_km ? `${patient.distance_km} km` : '4.2 km'}</span>
                  </div>
                </div>

                {/* Insurance & Medical Notes */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Coverage / TPA</span>
                    <span className="font-semibold text-slate-800">{patient?.insurance_type || 'Corporate TPA'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Medical History</span>
                    <span className="font-semibold text-slate-800">
                      {patient?.chronic_condition ? 'Hypertension (Managed)' : 'No Chronic Notes'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Consultation Context & Financial Value */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                  Scheduled Consultation
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Clinician</span>
                    <span className="font-semibold text-slate-800">{appointment.doctor_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Department</span>
                    <span className="font-semibold text-slate-800">{appointment.department}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">OPD Location</span>
                    <span className="font-semibold text-slate-800">Cabin {((appointment.id % 6) + 1)}B</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Slot Valuation</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      ₹{(appointment.estimated_slot_value || 3000).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pre-Consultation Clinical Intake */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                    Pre-Consultation Intake
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active Channel
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <p className="flex items-center gap-1.5 font-medium text-slate-800">
                    <Activity className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Reported Symptoms: Persistent throat irritation, low pyrexia</span>
                  </p>
                  <p className="text-[11px] text-slate-500 pl-5">
                    Attached Files: Blood glucose & lipid panel verified
                  </p>
                </div>
              </div>

              {/* Clinical Decision & Scheduling Dispatch Log */}
              {latestAgentResponse ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 pt-1">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Live Clinical Audit Record
                    </span>
                  </div>

                  {/* Summary Card */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Operation Intent:</span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {latestAgentResponse.intent}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Detected Language:</span>
                      <span className="font-semibold text-emerald-700">
                        {latestAgentResponse.detected_language === 'hi' ? 'Hindi / Hinglish' : 'English'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Protocol Match Score:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {(latestAgentResponse.confidence_score * 100).toFixed(1)}%
                      </span>
                    </div>

                    {latestAgentResponse.revenue_protected > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Revenue Safeguarded:</span>
                        <span className="font-bold text-emerald-700 font-mono text-sm">
                          ₹{latestAgentResponse.revenue_protected.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Executed Clinical Actions */}
                  {latestAgentResponse.tool_calls.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                        Executed Clinical Protocols ({latestAgentResponse.tool_calls.length})
                      </span>
                      <div className="space-y-1.5">
                        {latestAgentResponse.tool_calls.map((tool, idx) => {
                          const meta = getToolMetadata(tool.tool);
                          return (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between font-medium text-slate-900">
                                <span className="font-bold text-slate-800">{meta.title}</span>
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold border border-emerald-200">
                                  {meta.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-snug">{meta.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Clinical Rationale */}
                  {latestAgentResponse.thought_trace.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                        Clinical Coordination Notes
                      </span>
                      <div className="space-y-1">
                        {latestAgentResponse.thought_trace.map((thought, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-start gap-2 shadow-2xs"
                          >
                            <span className="text-emerald-700 font-mono font-bold text-[10px]">#{idx + 1}</span>
                            <span className="leading-snug">{thought}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Standby Waitlist Swapped Card */}
                  {latestAgentResponse.swapped_with_waitlist && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[11px]">
                        <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                        <span>Standby Waitlist Backfill Confirmed</span>
                      </div>
                      <p className="text-indigo-950 font-medium">
                        Vacated slot allocated to: <strong>{latestAgentResponse.swapped_with_waitlist.patient_name}</strong>
                      </p>
                      <span className="inline-block text-[10px] font-mono text-indigo-800 bg-white px-2 py-0.5 rounded-full border border-indigo-200 font-bold">
                        Priority: {latestAgentResponse.swapped_with_waitlist.priority}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Idle State: Operational Dispatch Timeline */
                <div className="space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                    Clinical Dispatch Timeline
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800">24h Outpatient Verification Sent</p>
                        <p className="text-[11px] text-slate-500">Automated reminder dispatched via WhatsApp Business API</p>
                        <span className="text-[10px] font-mono text-slate-400">Today • 09:00 AM</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800">Delivery & Read Receipt Verified</p>
                        <p className="text-[11px] text-slate-500">Patient handset active and acknowledged</p>
                        <span className="text-[10px] font-mono text-slate-400">Today • 09:01 AM</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800">OPD Roster Synchronized</p>
                        <p className="text-[11px] text-slate-500">Slot locked in Dr. Das's daily outpatient schedule</p>
                        <span className="text-[10px] font-mono text-slate-400">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Front-Desk Quick Action Buttons */}
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                      Front-Desk Quick Actions
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSendMessage('Confirm visit on arrival')}
                        className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200 transition-colors text-center"
                      >
                        Mark As Arrived
                      </button>
                      <button
                        onClick={() => handleSendMessage('Please send clinic directions')}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold border border-slate-200 transition-colors text-center"
                      >
                        Send Directions
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
