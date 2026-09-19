import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Send,
  Radio,
  ChevronDown
} from 'lucide-react';
import { api } from '../../api/client';
import { useActivityStream } from '../../context/ActivityStreamContext';
import { useAuth } from '../../context/AuthContext';

interface AIVoiceCallingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentBooked: () => void;
}

interface Message {
  role: 'ai' | 'user';
  text: string;
  time: string;
}

export const AIVoiceCallingModal: React.FC<AIVoiceCallingModalProps> = ({
  isOpen,
  onClose,
  onAppointmentBooked,
}) => {
  const { showToast } = useAuth();
  const { emitEvent } = useActivityStream();

  const [callStatus, setCallStatus] = useState<'CONNECTING' | 'ACTIVE' | 'PROCESSING' | 'ENDED'>('CONNECTING');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingSlot, setPendingSlot] = useState<any>(null);
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);
  const [textInput, setTextInput] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Synthesis and Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English locale

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        // If this result is final, send to voice backend
        if (event.results[0].isFinal) {
          handleSendSpeech(currentTranscript);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition status:', err.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Call timer and introductory greeting
  useEffect(() => {
    if (!isOpen) {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
      setCallStatus('CONNECTING');
      setMessages([]);
      setPendingSlot(null);
      setBookedAppointment(null);
      return;
    }

    // Connect call after 800ms
    const connectTimer = setTimeout(() => {
      setCallStatus('ACTIVE');
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // AI initial greeting with Indian clinical tone
      const greeting = "Namaste! This is SlotSure Clinic AI reception. How can I help you schedule an appointment today?";
      addMessage('ai', greeting);
      speakText(greeting, () => {
        startListeningSafe();
      });
    }, 800);

    return () => clearTimeout(connectTimer);
  }, [isOpen]);

  // Auto scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, transcript]);

  // Native Speech Synthesis with Indian Voice
  const speakText = (text: string, onEndCallback?: () => void) => {
    if (!synthRef.current || isSpeakerMuted) {
      if (onEndCallback) setTimeout(onEndCallback, 1200);
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Pick Indian English voice if present
    const voices = synthRef.current.getVoices();
    const indianVoice = voices.find(v => 
      v.lang === 'en-IN' || 
      v.lang.includes('IN') || 
      v.name.includes('India') || 
      v.name.includes('Hindi') ||
      v.name.includes('Rishi') ||
      v.name.includes('Kavya')
    );
    if (indianVoice) {
      utterance.voice = indianVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };

    synthRef.current.speak(utterance);
  };

  const startListeningSafe = () => {
    if (recognitionRef.current && !isMuted) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // already started
      }
    }
  };

  const addMessage = (role: 'ai' | 'user', text: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role, text, time: timeStr }]);
  };

  const handleSendSpeech = async (speechText: string) => {
    if (!speechText.trim()) return;
    
    addMessage('user', speechText);
    setTranscript('');
    setCallStatus('PROCESSING');

    try {
      const response = await api.voiceDialogue({
        user_speech: speechText,
        pending_slot: pendingSlot,
      });

      addMessage('ai', response.ai_response);
      setPendingSlot(response.pending_slot || null);

      if (response.status === 'CONFIRMED' && response.booked_appointment) {
        setBookedAppointment(response.booked_appointment);
        showToast(`Appointment #${response.booked_appointment.id} Booked via Voice AI!`, 'success');
        
        emitEvent({
          type: 'CONFIRMATION',
          title: 'Voice AI Booking Confirmed',
          description: `Voice AI booked ${response.booked_appointment.patient_name} with ${response.booked_appointment.doctor_name} (${response.booked_appointment.department})`,
          patientName: response.booked_appointment.patient_name,
          doctorName: response.booked_appointment.doctor_name,
          badge: 'Voice AI',
          badgeColor: '#4F8A70',
        });

        onAppointmentBooked();
      }

      setCallStatus('ACTIVE');
      speakText(response.ai_response, () => {
        if (response.status !== 'CONFIRMED') {
          startListeningSafe();
        }
      });
    } catch (err) {
      console.error('Error during voice dialogue:', err);
      const fallbackReply = "I'm sorry, I missed that. Could you please repeat your preferred doctor or department?";
      addMessage('ai', fallbackReply);
      setCallStatus('ACTIVE');
      speakText(fallbackReply, () => startListeningSafe());
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const text = textInput;
    setTextInput('');
    handleSendSpeech(text);
  };

  const handleQuickChip = (text: string) => {
    handleSendSpeech(text);
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.abort();
    setCallStatus('ENDED');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-md bg-[#121214] text-white rounded-3xl border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col h-[640px] relative"
        >
          {/* Top Apple Vision Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full" />

          {/* Call Header */}
          <div className="pt-6 pb-4 px-6 text-center border-b border-white/[0.08] relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-emerald-400 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>SlotSure Clinical AI Voice</span>
            </div>

            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Appointment Desk</span>
              <Sparkles className="h-4 w-4 text-[#C18A3A]" />
            </h3>

            <div className="flex items-center gap-2 text-xs text-white/50 mt-1 font-mono">
              <span>{callStatus === 'CONNECTING' ? 'Connecting...' : formatTimer(callDuration)}</span>
              <span>•</span>
              <span className="text-emerald-400 font-sans font-medium">Indian English (en-IN)</span>
            </div>
          </div>

          {/* Dynamic Audio Waveform Visualizer */}
          <div className="h-20 flex items-center justify-center gap-1.5 px-8 bg-black/30 border-b border-white/[0.05] relative">
            {[0.4, 0.8, 1.2, 0.6, 1.0, 1.5, 0.7, 1.1, 0.5, 0.9, 1.3, 0.6].map((multiplier, i) => (
              <motion.div
                key={i}
                animate={{
                  height: isSpeaking
                    ? [8, 38 * multiplier, 12, 44 * multiplier, 8]
                    : isListening
                    ? [6, 24 * multiplier, 10, 20 * multiplier, 6]
                    : 6,
                  backgroundColor: isSpeaking
                    ? '#10B981' // Emerald when AI speaks
                    : isListening
                    ? '#C18A3A' // Amber when user mic listens
                    : 'rgba(255,255,255,0.15)'
                }}
                transition={{
                  repeat: Infinity,
                  duration: isSpeaking ? 0.7 : 1.1,
                  ease: 'easeInOut',
                  delay: i * 0.06
                }}
                className="w-1 rounded-full"
              />
            ))}

            <div className="absolute right-4 text-[10px] font-mono uppercase tracking-wider text-white/40">
              {isSpeaking ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Volume2 className="h-3 w-3" /> Speaking
                </span>
              ) : isListening ? (
                <span className="text-[#C18A3A] font-semibold flex items-center gap-1">
                  <Mic className="h-3 w-3 animate-pulse" /> Listening
                </span>
              ) : (
                <span>Connected</span>
              )}
            </div>
          </div>

          {/* Conversation Transcript Stream */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth text-xs"
          >
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-white/[0.08] text-white/90 border border-white/[0.08] rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="text-[10px] text-white/35 mt-1 px-1">{msg.time}</span>
              </motion.div>
            ))}

            {/* Interim Speech Indicator */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-end"
              >
                <div className="max-w-[85%] rounded-2xl px-3.5 py-2 bg-emerald-600/40 border border-emerald-500/40 text-white italic">
                  <span>{transcript}...</span>
                </div>
              </motion.div>
            )}

            {/* Extracted Pending Slot Card */}
            {pendingSlot && !bookedAppointment && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded-2xl bg-[#C18A3A]/10 border border-[#C18A3A]/30 text-white space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-wide uppercase text-[#C18A3A] flex items-center gap-1">
                    <Radio className="h-3 w-3 animate-pulse" /> Ready to Confirm
                  </span>
                  <span className="text-[10px] text-white/60">Say "Yes, confirm it"</span>
                </div>
                <div className="text-sm font-semibold text-white">
                  {pendingSlot.doctor_name} • {pendingSlot.department}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/80">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-emerald-400" /> {pendingSlot.appointment_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-emerald-400" /> {pendingSlot.appointment_time}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Confirmed Slot Success Card */}
            {bookedAppointment && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-white space-y-2"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Appointment Confirmed & Scored</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/80 mt-1">
                  <div>Ref ID: #{bookedAppointment.id}</div>
                  <div>Doctor: {bookedAppointment.doctor_name}</div>
                  <div>Date: {bookedAppointment.appointment_date}</div>
                  <div>Time: {bookedAppointment.appointment_time}</div>
                </div>
                <div className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  ML Risk Scored: {bookedAppointment.risk_level} ({Math.round(bookedAppointment.risk_probability * 100)}%)
                </div>
              </motion.div>
            )}
          </div>

          {/* Quick 1-Tap Dialogue Chips */}
          <div className="px-4 py-2 bg-black/20 border-t border-white/[0.05] overflow-x-auto flex items-center gap-2 no-scrollbar">
            {!pendingSlot && !bookedAppointment && (
              <>
                <button
                  onClick={() => handleQuickChip('I want to book Dr. Sharma for Cardiology tomorrow morning')}
                  className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] text-white/80 whitespace-nowrap transition-all"
                >
                  "Book Dr. Sharma tomorrow"
                </button>
                <button
                  onClick={() => handleQuickChip('Book an appointment with Dr. Kapoor in Pediatrics')}
                  className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] text-white/80 whitespace-nowrap transition-all"
                >
                  "Dr. Kapoor Pediatrics"
                </button>
                <button
                  onClick={() => handleQuickChip('Book General Medicine')}
                  className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] text-white/80 whitespace-nowrap transition-all"
                >
                  "General Medicine"
                </button>
              </>
            )}
            {pendingSlot && !bookedAppointment && (
              <>
                <button
                  onClick={() => handleQuickChip('Yes, please confirm it')}
                  className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-[11px] font-semibold text-white whitespace-nowrap transition-all"
                >
                  "Yes, confirm it"
                </button>
                <button
                  onClick={() => handleQuickChip('Change to afternoon')}
                  className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] text-white/80 whitespace-nowrap transition-all"
                >
                  "Change to afternoon"
                </button>
              </>
            )}
          </div>

          {/* Text/Keyboard Fallback Form */}
          <form onSubmit={handleTextSubmit} className="px-4 py-2.5 flex items-center gap-2 bg-black/40 border-t border-white/[0.05]">
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Speak into mic or type your booking request..."
              className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-hidden focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="h-8 w-8 rounded-xl bg-white/[0.1] hover:bg-white/[0.18] flex items-center justify-center text-white disabled:opacity-30 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Apple Call Footer Controls */}
          <div className="py-4 px-6 bg-[#0E0E10] border-t border-white/[0.08] flex items-center justify-around">
            {/* Mute Mic Button */}
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (!isMuted && recognitionRef.current) {
                  recognitionRef.current.abort();
                } else if (isMuted) {
                  startListeningSafe();
                }
              }}
              className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                isMuted ? 'text-amber-400' : 'text-white/70 hover:text-white'
              }`}
            >
              <div
                className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${
                  isMuted ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-white/[0.08] hover:bg-white/[0.14]'
                }`}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </div>
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="flex flex-col items-center gap-1 text-[10px] font-medium text-white/70 hover:text-white transition-all active:scale-95"
            >
              <div className="h-14 w-14 rounded-full bg-[#C9685B] hover:bg-[#D9796C] text-white flex items-center justify-center shadow-lg shadow-[#C9685B]/30">
                <PhoneOff className="h-6 w-6" />
              </div>
              <span className="font-semibold text-white">End Call</span>
            </button>

            {/* Speaker Toggle */}
            <button
              onClick={() => {
                if (!isSpeakerMuted && synthRef.current) {
                  synthRef.current.cancel();
                }
                setIsSpeakerMuted(!isSpeakerMuted);
              }}
              className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                isSpeakerMuted ? 'text-amber-400' : 'text-white/70 hover:text-white'
              }`}
            >
              <div
                className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${
                  isSpeakerMuted ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-white/[0.08] hover:bg-white/[0.14]'
                }`}
              >
                {isSpeakerMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </div>
              <span>Speaker</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
