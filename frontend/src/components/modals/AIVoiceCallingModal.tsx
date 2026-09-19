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
  Languages
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
      // 1. Apple macOS crystal-clear Lekha Hindi voice
      const lekha = voices.find(v => v.name.toLowerCase().includes('lekha'));
      if (lekha) return lekha;

      // 2. Google Hindi Neural Voice
      const googleHi = voices.find(v => v.name.includes('Google') && (v.lang.includes('hi') || v.name.includes('हिन्दी')));
      if (googleHi) return googleHi;

      // 3. Any Hindi voice
      const anyHi = voices.find(v => v.lang.startsWith('hi') || v.lang === 'hi-IN' || v.lang === 'hi_IN');
      if (anyHi) return anyHi;
    }

    // English or Hindi Fallback (Prioritize clear, natural Indian English or crystal clear Siri/Samantha)
    // 1. Rishi (English (India)) - Apple Crystal Clear Indian English
    const rishi = voices.find(v => v.name.toLowerCase().includes('rishi'));
    if (rishi) return rishi;

    // 2. Google Indian English
    const googleIn = voices.find(v => v.name.includes('Google') && v.lang.includes('en-IN'));
    if (googleIn) return googleIn;

    // 3. Apple Enhanced / Studio voices (Samantha, Ava, Daniel, Karen)
    const appleEnhanced = voices.find(v => 
      (v.name.includes('Samantha') || v.name.includes('Ava') || v.name.includes('Daniel') || v.name.includes('Siri') || v.name.includes('Karen')) &&
      !v.name.includes('Whisper')
    );
    if (appleEnhanced) return appleEnhanced;

    // 4. Any en-IN voice
    const anyIn = voices.find(v => v.lang === 'en-IN' || v.lang === 'en_IN');
    if (anyIn) return anyIn;

    // 5. Standard high-clarity English fallback
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
      // Use language preference or default to en-IN (which natively supports Hinglish/names)
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

      // Language-tailored clear greeting
      const isHindiMode = languagePref === 'hi';
      const initialLang = isHindiMode ? 'hi' : 'en';
      setCurrentLanguage(initialLang);

      const greeting = isHindiMode
        ? "Namaste! Main SlotSure Clinic AI reception hoon. Main aapka doctor appointment schedule kar sakti hoon. Aap kin doctor se milna chahte hain?"
        : "Hello! This is SlotSure Clinic AI reception. How can I help you schedule an appointment today?";

      addMessage('ai', greeting, initialLang);
      speakText(greeting, initialLang, () => {
        startListeningSafe();
      });
    }, 600);

    return () => clearTimeout(connectTimer);
  }, [isOpen, languagePref]);

  // Auto scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, transcript]);

  // Crystal-Clear Native Speech Synthesis
  const speakText = (text: string, targetLang: 'hi' | 'en', onEndCallback?: () => void) => {
    if (!synthRef.current || isSpeakerMuted) {
      if (onEndCallback) setTimeout(onEndCallback, 1000);
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Pick crystal clear HD voice
    const voices = synthRef.current.getVoices();
    const chosenVoice = getBestVoice(targetLang, voices.length > 0 ? voices : availableVoices);

    if (chosenVoice) {
      utterance.voice = chosenVoice;
      setActiveVoiceName(chosenVoice.name);
      utterance.lang = chosenVoice.lang;
    } else {
      utterance.lang = targetLang === 'hi' ? 'hi-IN' : 'en-IN';
    }

    // Optimal acoustic clarity tuning:
    // 0.92x rate delivers clean, intelligible articulation without sounding robotic or slurred
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

    utterance.onerror = (e) => {
      console.warn('Speech synthesis notice:', e);
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };

    synthRef.current.speak(utterance);
  };

  const startListeningSafe = () => {
    if (recognitionRef.current && !isMuted) {
      try {
        // Adjust recognition language dynamically
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
        showToast(`Appointment #${response.booked_appointment.id} Confirmed via Voice AI!`, 'success');

        emitEvent({
          type: 'CONFIRMATION',
          title: 'Voice AI Booking Confirmed',
          description: `Voice AI (${responseLang.toUpperCase()}) booked ${response.booked_appointment.patient_name} with ${response.booked_appointment.doctor_name} (${response.booked_appointment.department})`,
          patientName: response.booked_appointment.patient_name,
          doctorName: response.booked_appointment.doctor_name,
          badge: responseLang === 'hi' ? 'Hindi Voice' : 'English Voice',
          badgeColor: '#4F8A70',
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
        ? "Kshama karein, main theek se sun nahi payi. Kya aap doctor ya department ka naam dobara bata sakte hain?"
        : "I'm sorry, I didn't catch that. Could you please repeat your preferred doctor or department?";
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
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-md bg-[#121214] text-white rounded-3xl border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col h-[650px] relative"
        >
          {/* Top Apple Vision Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-emerald-500/15 blur-[80px] pointer-events-none rounded-full" />

          {/* Call Header */}
          <div className="pt-5 pb-3 px-6 text-center border-b border-white/[0.08] relative z-10 flex flex-col items-center">
            {/* Language Switcher Pill */}
            <div className="flex items-center gap-1 p-0.5 rounded-full bg-white/[0.08] border border-white/[0.1] text-[11px] mb-2.5">
              <button
                onClick={() => setLanguagePref('auto')}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  languagePref === 'auto'
                    ? 'bg-emerald-500 text-white font-medium shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Auto-Detect
              </button>
              <button
                onClick={() => {
                  setLanguagePref('hi');
                  setCurrentLanguage('hi');
                }}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  languagePref === 'hi'
                    ? 'bg-emerald-500 text-white font-medium shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                🇮🇳 Hindi / Hinglish
              </button>
              <button
                onClick={() => {
                  setLanguagePref('en');
                  setCurrentLanguage('en');
                }}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  languagePref === 'en'
                    ? 'bg-emerald-500 text-white font-medium shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                🇬🇧 English
              </button>
            </div>

            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>SlotSure Clinical AI Voice</span>
              <Sparkles className="h-4 w-4 text-[#C18A3A]" />
            </h3>

            <div className="flex items-center gap-2 text-xs text-white/50 mt-1 font-mono">
              <span>{callStatus === 'CONNECTING' ? 'Connecting...' : formatTimer(callDuration)}</span>
              <span>•</span>
              <span className="text-emerald-400 font-sans font-medium">
                {currentLanguage === 'hi' ? 'Speaking Hindi (Lekha HD)' : 'Speaking English (Rishi HD)'}
              </span>
            </div>
          </div>

          {/* Dynamic Audio Waveform Visualizer & Voice Fidelity Tag */}
          <div className="h-20 flex flex-col items-center justify-center px-8 bg-black/30 border-b border-white/[0.05] relative">
            <div className="flex items-center justify-center gap-1.5 w-full">
              {[0.4, 0.8, 1.3, 0.6, 1.1, 1.6, 0.7, 1.2, 0.5, 1.0, 1.4, 0.6].map((multiplier, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: isSpeaking
                      ? [8, 36 * multiplier, 12, 42 * multiplier, 8]
                      : isListening
                      ? [6, 22 * multiplier, 10, 18 * multiplier, 6]
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
            </div>

            <div className="flex items-center justify-between w-full mt-2 text-[10px] text-white/40">
              <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
                <Sparkles className="h-2.5 w-2.5" />
                Clear Voice: {activeVoiceName}
              </span>

              <span className="font-mono uppercase tracking-wider">
                {isSpeaking ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Volume2 className="h-3 w-3" /> Speaking
                  </span>
                ) : isListening ? (
                  <span className="text-[#C18A3A] font-semibold flex items-center gap-1">
                    <Mic className="h-3 w-3 animate-pulse" /> Listening
                  </span>
                ) : (
                  <span>Ready</span>
                )}
              </span>
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
                <div className="flex items-center gap-1.5 text-[10px] text-white/35 mt-1 px-1">
                  <span>{msg.time}</span>
                  {msg.lang && (
                    <span>• {msg.lang === 'hi' ? '🇮🇳 Hindi' : '🇬🇧 English'}</span>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Interim Live Speech Indicator */}
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
                  <span className="text-[10px] text-white/60">
                    {currentLanguage === 'hi' ? 'Boliye: "Haan confirm kardo"' : 'Say: "Yes, confirm it"'}
                  </span>
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
                  <span>
                    {currentLanguage === 'hi' ? 'Appointment Confirm Ho Gaya!' : 'Appointment Confirmed & Scored'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/80 mt-1">
                  <div>Ref ID: #{bookedAppointment.id}</div>
                  <div>Doctor: {bookedAppointment.doctor_name}</div>
                  <div>Date: {bookedAppointment.appointment_date}</div>
                  <div>Time: {bookedAppointment.appointment_time}</div>
                </div>
                <div className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  ML Risk: {bookedAppointment.risk_level} ({Math.round(bookedAppointment.risk_probability * 100)}%)
                </div>
              </motion.div>
            )}
          </div>

          {/* Quick 1-Tap Bilingual Dialogue Chips */}
          <div className="px-4 py-2 bg-black/20 border-t border-white/[0.05] overflow-x-auto flex items-center gap-2 no-scrollbar">
            {!pendingSlot && !bookedAppointment && (
              <>
                {currentLanguage === 'hi' ? (
                  <>
                    <button
                      onClick={() => handleSendSpeech('Mujhe kal subah Dr. Sharma se milna hai')}
                      className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] text-white/80 whitespace-nowrap transition-all"
                    >
                      "Kal subah Dr. Sharma"
                    </button>
                    <button
                      onClick={() => handleSendSpeech('Dr. Kapoor ke sath Pediatrics mein appointment chahiye')}
                      className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] text-white/80 whitespace-nowrap transition-all"
                    >
                      "Dr. Kapoor Pediatrics"
                    </button>
                    <button
                      onClick={() => handleSendSpeech('General Medicine mein appointment chahiye')}
                      className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] text-white/80 whitespace-nowrap transition-all"
                    >
                      "General Medicine"
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleSendSpeech('I want to book Dr. Sharma for Cardiology tomorrow morning')}
                      className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] text-white/80 whitespace-nowrap transition-all"
                    >
                      "Book Dr. Sharma tomorrow"
                    </button>
                    <button
                      onClick={() => handleSendSpeech('Book an appointment with Dr. Kapoor in Pediatrics')}
                      className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] text-white/80 whitespace-nowrap transition-all"
                    >
                      "Dr. Kapoor Pediatrics"
                    </button>
                    <button
                      onClick={() => handleSendSpeech('Book General Medicine')}
                      className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] text-white/80 whitespace-nowrap transition-all"
                    >
                      "General Medicine"
                    </button>
                  </>
                )}
              </>
            )}

            {pendingSlot && !bookedAppointment && (
              <>
                <button
                  onClick={() => handleSendSpeech(currentLanguage === 'hi' ? 'Haan, confirm kar dijiye' : 'Yes, please confirm it')}
                  className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-[11px] font-semibold text-white whitespace-nowrap transition-all"
                >
                  {currentLanguage === 'hi' ? '"Haan, confirm kardo"' : '"Yes, confirm it"'}
                </button>
                <button
                  onClick={() => handleSendSpeech(currentLanguage === 'hi' ? 'Dopahar ka time chahiye' : 'Change to afternoon')}
                  className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] text-white/80 whitespace-nowrap transition-all"
                >
                  {currentLanguage === 'hi' ? '"Dopahar ka time"' : '"Change to afternoon"'}
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
              placeholder={currentLanguage === 'hi' ? 'Boliye ya type kijiye (Hindi/English)...' : 'Speak into mic or type your booking request...'}
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
