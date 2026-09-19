import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  Send,
  X,
  Stethoscope,
  Activity
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
  lang?: 'hi' | 'en';
}

const CLINIC_DOCTORS = [
  { name: 'Dr. Sharma', dept: 'Cardiology', time: '10:00 AM - 02:00 PM', room: 'Suite 201' },
  { name: 'Dr. Verma', dept: 'General Medicine', time: '09:00 AM - 01:00 PM', room: 'Room 104' },
  { name: 'Dr. Kapoor', dept: 'Pediatrics', time: '11:00 AM - 04:00 PM', room: 'Suite 305' },
  { name: 'Dr. Patel', dept: 'Orthopedics', time: '02:00 PM - 06:00 PM', room: 'Room 112' },
  { name: 'Dr. Nair', dept: 'Dermatology', time: '10:30 AM - 03:30 PM', room: 'Suite 208' },
];

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
  const [showDirectory, setShowDirectory] = useState<boolean>(false);

  // Multilingual & Clear Voice Selection States
  const [languagePref, setLanguagePref] = useState<'auto' | 'hi' | 'en'>('auto');
  const [currentLanguage, setCurrentLanguage] = useState<'hi' | 'en'>('en');
  const [activeVoiceName, setActiveVoiceName] = useState<string>('Detecting HD Voice...');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Load and cache all available voices
  const populateVoices = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
        const best = getBestVoice(currentLanguage, voices);
        if (best) setActiveVoiceName(best.name);
      }
    }
  };

  useEffect(() => {
    populateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
  }, []);

  // Update selected voice when language changes
  useEffect(() => {
    if (availableVoices.length > 0) {
      const best = getBestVoice(currentLanguage, availableVoices);
      if (best) setActiveVoiceName(best.name);
    }
  }, [currentLanguage, availableVoices]);

  // Voice Selection Strategy for Crystal Clear Audio
  const getBestVoice = (lang: 'hi' | 'en', voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (!voices || voices.length === 0) return null;

    if (lang === 'hi') {
      const lekha = voices.find(v => v.name.toLowerCase().includes('lekha'));
      if (lekha) return lekha;
      const googleHi = voices.find(v => v.name.includes('Google') && (v.lang.includes('hi') || v.name.includes('हिन्दी')));
      if (googleHi) return googleHi;
      const anyHi = voices.find(v => v.lang.startsWith('hi') || v.lang === 'hi-IN' || v.lang === 'hi_IN');
      if (anyHi) return anyHi;
    }

    const rishi = voices.find(v => v.name.toLowerCase().includes('rishi'));
    if (rishi) return rishi;
    const googleIn = voices.find(v => v.name.includes('Google') && v.lang.includes('en-IN'));
    if (googleIn) return googleIn;

    const appleEnhanced = voices.find(v =>
      (v.name.includes('Samantha') || v.name.includes('Ava') || v.name.includes('Daniel') || v.name.includes('Siri')) &&
      !v.name.includes('Whisper')
    );
    if (appleEnhanced) return appleEnhanced;

    const anyIn = voices.find(v => v.lang === 'en-IN' || v.lang === 'en_IN');
    if (anyIn) return anyIn;

    const clearEn = voices.find(v =>
      v.lang.startsWith('en') &&
      !['Fred', 'Albert', 'Bad News', 'Bells', 'Cellos', 'Good News', 'Pipe Organ', 'Trinoids', 'Whisper', 'Zarvox'].includes(v.name)
    );

    return clearEn || voices[0] || null;
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = languagePref === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          handleSendSpeech(currentTranscript);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition notice:', err.error);
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
  }, [languagePref]);

  // Call lifecycle and greeting
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

    // Connect call
    const connectTimer = setTimeout(() => {
      setCallStatus('ACTIVE');
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      const isHindiMode = languagePref === 'hi';
      const initialLang = isHindiMode ? 'hi' : 'en';
      setCurrentLanguage(initialLang);

      const greeting = isHindiMode
        ? "Namaste! SlotSure Clinic AI reception mein aapka swagat hai. Main aapka doctor appointment book kar sakti hoon. Aap kin doctor se milna chahte hain?"
        : "Hello! This is the SlotSure Clinical AI Voice Reception Desk. How may I assist you with scheduling a consultation today?";

      addMessage('ai', greeting, initialLang);
      speakText(greeting, initialLang, () => {
        startListeningSafe();
      });
    }, 500);

    return () => clearTimeout(connectTimer);
  }, [isOpen, languagePref]);

  // Auto scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, transcript]);

  // Native Speech Synthesis
  const speakText = (text: string, targetLang: 'hi' | 'en', onEndCallback?: () => void) => {
    if (!synthRef.current || isSpeakerMuted) {
      if (onEndCallback) setTimeout(onEndCallback, 1000);
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    const voices = synthRef.current.getVoices();
    const chosenVoice = getBestVoice(targetLang, voices.length > 0 ? voices : availableVoices);

    if (chosenVoice) {
      utterance.voice = chosenVoice;
      setActiveVoiceName(chosenVoice.name);
      utterance.lang = chosenVoice.lang;
    } else {
      utterance.lang = targetLang === 'hi' ? 'hi-IN' : 'en-IN';
    }

    utterance.rate = targetLang === 'hi' ? 0.90 : 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

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
        recognitionRef.current.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
        recognitionRef.current.start();
      } catch (e) {
        // already started
      }
    }
  };

  const addMessage = (role: 'ai' | 'user', text: string, lang?: 'hi' | 'en') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role, text, time: timeStr, lang }]);
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
        preferred_language: languagePref,
      });

      const responseLang = response.language || (languagePref === 'hi' ? 'hi' : 'en');
      setCurrentLanguage(responseLang);
      addMessage('ai', response.ai_response, responseLang);
      setPendingSlot(response.pending_slot || null);

      if (response.status === 'CONFIRMED' && response.booked_appointment) {
        setBookedAppointment(response.booked_appointment);
        showToast(`Appointment #${response.booked_appointment.id} Scheduled via Live Voice AI!`, 'success');

        emitEvent({
          type: 'CONFIRMATION',
          title: 'Live Voice AI Booking Synced',
          description: `Voice Desk booked ${response.booked_appointment.patient_name} with ${response.booked_appointment.doctor_name} (${response.booked_appointment.department})`,
          patientName: response.booked_appointment.patient_name,
          doctorName: response.booked_appointment.doctor_name,
          badge: responseLang === 'hi' ? 'Hindi Voice' : 'English Voice',
          badgeColor: '#2563EB',
        });

        onAppointmentBooked();
      }

      setCallStatus('ACTIVE');
      speakText(response.ai_response, responseLang, () => {
        if (response.status !== 'CONFIRMED') {
          startListeningSafe();
        }
      });
    } catch (err) {
      console.error('Error during voice dialogue:', err);
      const fallbackReply = currentLanguage === 'hi'
        ? "Kshama karein, main theek se sun nahi payi. Kya aap doctor ya department dobara bata sakte hain?"
        : "I didn't quite catch that. Could you please specify the doctor or department you would like to visit?";
      addMessage('ai', fallbackReply, currentLanguage);
      setCallStatus('ACTIVE');
      speakText(fallbackReply, currentLanguage, () => startListeningSafe());
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const text = textInput;
    setTextInput('');
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
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          className="w-full max-w-2xl bg-white dark:bg-[#181818] text-[#1D1D1F] dark:text-white rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-[0_24px_64px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col h-[680px] relative"
        >
          {/* ===================== DESK HEADER ===================== */}
          <div className="pt-4 pb-3.5 px-6 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-[#FAFAFA] dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center shadow-2xs">
                <Activity className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                    Clinical AI Voice Reception Desk
                  </h3>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Live Audio Line
                  </span>
                </div>
                <p className="text-xs text-[#6B6B6F] dark:text-white/50 mt-0.5 flex items-center gap-2">
                  <span>Duration: <strong className="font-mono text-[#1D1D1F] dark:text-white">{formatTimer(callDuration)}</strong></span>
                  <span>•</span>
                  <span>Audio Fidelity: {activeVoiceName ? activeVoiceName.split(' ')[0] : 'HD Clear'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <div className="p-0.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] flex items-center text-xs">
                <button
                  onClick={() => {
                    setLanguagePref('en');
                    setCurrentLanguage('en');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    languagePref === 'en' || languagePref === 'auto'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-[#6B6B6F] hover:text-[#1D1D1F]'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => {
                    setLanguagePref('hi');
                    setCurrentLanguage('hi');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    languagePref === 'hi'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-[#6B6B6F] hover:text-[#1D1D1F]'
                  }`}
                >
                  हिंदी
                </button>
              </div>

              <button
                onClick={handleEndCall}
                className="h-8 w-8 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] hover:bg-black/[0.06] flex items-center justify-center text-[#6B6B6F] hover:text-[#1D1D1F] transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ===================== LIVE SOUNDWAVE & STATUS ===================== */}
          <div className="px-6 py-3 bg-[#F8F9FA] dark:bg-white/[0.02] border-b border-black/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#1D1D1F]">
                {isSpeaking ? (
                  <span className="text-blue-700 flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                    AI Receptionist Speaking
                  </span>
                ) : isListening ? (
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <Mic className="h-3.5 w-3.5 animate-pulse" />
                    Listening to you (Speak anytime)...
                  </span>
                ) : callStatus === 'PROCESSING' ? (
                  <span className="text-amber-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                    Matching Clinical Schedules...
                  </span>
                ) : (
                  <span className="text-[#6B6B6F] flex items-center gap-1.5">
                    <Mic className="h-3.5 w-3.5" />
                    Microphone Ready
                  </span>
                )}
              </span>
            </div>

            {/* Equalizer Soundwave */}
            <div className="flex items-center gap-1 h-5">
              {[20, 60, 40, 80, 50, 75, 45, 90, 65, 35].map((height, i) => (
                <motion.div
                  key={i}
                  className={`w-1 rounded-full ${
                    isSpeaking ? 'bg-blue-600' : isListening ? 'bg-emerald-500' : 'bg-black/20'
                  }`}
                  animate={{
                    height: isSpeaking || isListening
                      ? [`${Math.max(15, height * 0.3)}%`, `${height}%`, `${Math.max(20, height * 0.4)}%`]
                      : '20%',
                  }}
                  transition={{
                    duration: 0.6 + (i % 3) * 0.15,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                    delay: i * 0.04,
                  }}
                />
              ))}
            </div>

            {/* Clinic Schedule Toggle Button */}
            <button
              onClick={() => setShowDirectory(!showDirectory)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Stethoscope className="h-3.5 w-3.5" />
              <span>{showDirectory ? 'Hide Schedule' : 'View Available Doctors'}</span>
            </button>
          </div>

          {/* ===================== CLINIC SCHEDULE DRAWER ===================== */}
          <AnimatePresence>
            {showDirectory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-white dark:bg-[#151517] border-b border-black/[0.06] p-4 overflow-hidden text-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-[#1D1D1F] text-xs">Today's Active Doctors & Consultation Hours</span>
                  <span className="text-[10px] text-[#6B6B6F]">Click any doctor to ask about their schedule</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CLINIC_DOCTORS.map((doc, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSendSpeech(`Book an appointment with ${doc.name}`)}
                      className="p-2 rounded-xl bg-[#F8F9FA] hover:bg-blue-50 border border-black/[0.06] hover:border-blue-200 transition-all cursor-pointer group"
                    >
                      <div className="font-semibold text-[#1D1D1F] group-hover:text-blue-700">{doc.name}</div>
                      <div className="text-[11px] text-[#6B6B6F]">{doc.dept}</div>
                      <div className="text-[10px] text-emerald-700 font-medium mt-1">{doc.time}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===================== CONVERSATION STREAM ===================== */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-5 space-y-3.5 scroll-smooth text-xs"
          >
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed text-xs shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-[#F8F9FA] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white border border-black/[0.06] rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#86868B] mt-1 px-1">
                  <span>{msg.time}</span>
                  {msg.lang && (
                    <span>• {msg.lang === 'hi' ? 'Hindi' : 'English'}</span>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Interim Speech Preview */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-end"
              >
                <div className="max-w-[85%] rounded-2xl px-3.5 py-2 bg-blue-50 border border-blue-200 text-blue-900 italic text-xs">
                  <span>{transcript}...</span>
                </div>
              </motion.div>
            )}

            {/* Pending Slot Card for Confirmation */}
            {pendingSlot && !bookedAppointment && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-[#1D1D1F] space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-amber-800 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span>Slot Found · Say "Confirm" to book</span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                    Available Now
                  </span>
                </div>

                <div className="font-bold text-sm text-[#1D1D1F]">
                  {pendingSlot.doctor_name} · {pendingSlot.department}
                </div>

                <div className="flex items-center gap-3 text-xs text-[#555558]">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" /> {pendingSlot.appointment_date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-blue-600" /> {pendingSlot.appointment_time}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleSendSpeech('Yes, please confirm this appointment')}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-2xs cursor-pointer"
                  >
                    Confirm Slot
                  </button>
                  <button
                    onClick={() => handleSendSpeech('Cancel and choose another doctor')}
                    className="py-2 px-3 rounded-xl border border-black/[0.1] bg-white hover:bg-slate-50 text-xs font-medium text-[#1D1D1F] transition-all cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </motion.div>
            )}

            {/* Confirmed Real Appointment Ticket */}
            {bookedAppointment && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>Appointment Confirmed & Synchronized</span>
                  </div>
                  <span className="font-mono text-xs text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 font-semibold">
                    Ref #{bookedAppointment.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-xl bg-white border border-emerald-100">
                    <span className="text-[10px] text-[#6B6B6F] uppercase block">Doctor & Specialty</span>
                    <span className="font-semibold text-[#1D1D1F]">{bookedAppointment.doctor_name} ({bookedAppointment.department})</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-emerald-100">
                    <span className="text-[10px] text-[#6B6B6F] uppercase block">Consultation Time</span>
                    <span className="font-semibold text-[#1D1D1F]">{bookedAppointment.appointment_date} · {bookedAppointment.appointment_time}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-emerald-800 font-medium">
                    ML No-Show Risk: <strong className="text-emerald-900">{bookedAppointment.risk_level || 'LOW'}</strong> ({Math.round((bookedAppointment.risk_probability || 0.12) * 100)}%)
                  </span>
                  <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline" onClick={handleEndCall}>
                    View on Dashboard →
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* ===================== HYBRID TEXT & CONTROLS ===================== */}
          <div className="p-4 bg-[#FAFAFA] dark:bg-white/[0.02] border-t border-black/[0.06] space-y-3">
            {/* Input Bar */}
            <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder={currentLanguage === 'hi' ? 'Boliye ya type kijiye (Hindi/English)...' : 'Speak or type your consultation request...'}
                className="flex-1 bg-white dark:bg-white/[0.04] border border-black/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] dark:text-white placeholder:text-[#86868B] focus:outline-hidden focus:border-blue-500 shadow-2xs"
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-30 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <span>Send</span>
                <Send className="h-3 w-3" />
              </button>
            </form>

            {/* Primary Audio Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                {/* Mute Mic */}
                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    if (!isMuted && recognitionRef.current) {
                      recognitionRef.current.abort();
                    } else if (isMuted) {
                      startListeningSafe();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isMuted
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-black/[0.08] bg-white hover:bg-black/[0.02] text-[#1D1D1F]'
                  }`}
                >
                  {isMuted ? <MicOff className="h-3.5 w-3.5 text-amber-600" /> : <Mic className="h-3.5 w-3.5 text-emerald-600" />}
                  <span>{isMuted ? 'Unmute Mic' : 'Mic Active'}</span>
                </button>

                {/* Speaker Toggle */}
                <button
                  onClick={() => {
                    if (!isSpeakerMuted && synthRef.current) {
                      synthRef.current.cancel();
                    }
                    setIsSpeakerMuted(!isSpeakerMuted);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSpeakerMuted
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-black/[0.08] bg-white hover:bg-black/[0.02] text-[#1D1D1F]'
                  }`}
                >
                  {isSpeakerMuted ? <VolumeX className="h-3.5 w-3.5 text-amber-600" /> : <Volume2 className="h-3.5 w-3.5 text-blue-600" />}
                  <span>{isSpeakerMuted ? 'Muted' : 'Audio On'}</span>
                </button>
              </div>

              {/* End Call */}
              <button
                onClick={handleEndCall}
                className="px-4 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                <span>Disconnect Call</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
