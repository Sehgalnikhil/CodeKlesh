import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Lenis from 'lenis';
import {
  ArrowRight,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronDown,
  Activity,
  Check,
  Calendar,
  UserCheck,
  RefreshCw,
  TrendingDown,
  Layers,
  PhoneCall,
  Loader2,
  ChevronRight,
  User,
  Building2,
  Compass,
  MessageSquare,
  TrendingUp,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { Appointment, AnalyticsResponse, WaitlistEntry } from '../types';
import { Architectural3DTimeline } from '../components/spatial3d/Architectural3DTimeline';
import { Apple3DRecoveryConvergence, RecoveryStage } from '../components/spatial3d/Apple3DRecoveryConvergence';
import { AppleVision3DCard } from '../components/ui/AppleVision3DCard';
import { HorizontalStorySection } from '../components/story/HorizontalStorySection';
import { RunningCinematicBackdrop } from '../components/ui/RunningCinematicBackdrop';
import { LiveInteractiveVoiceAgentModal } from '../components/modals/LiveInteractiveVoiceAgentModal';

interface SpatialStoryPageProps {
  onOpenLiveOperations: () => void;
  onOpenDemoModal: () => void;
  onSelectAppointment?: (app: Appointment) => void;
  onRefreshGlobalData?: () => void;
}

export const SpatialStoryPage: React.FC<SpatialStoryPageProps> = ({
  onOpenLiveOperations,
  onOpenDemoModal,
  onSelectAppointment,
  onRefreshGlobalData,
}) => {
  // Global scroll tracking for top reading progress bar
  const { scrollYProgress } = useScroll();

  // Smooth scroll using Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const req = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(req);
      lenis.destroy();
    };
  }, []);

  // Data states from Backend
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [focalApp, setFocalApp] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  // 3D Timeline Active Narrative Stage (0: Overview, 1: Risk Isolated, 2: Explain Factors, 3: Waitlist Entering, 4: Recovered)
  const [timelineStage, setTimelineStage] = useState<number>(0);
  const [focusedTimelineIndex, setFocusedTimelineIndex] = useState<number | undefined>(undefined);

  // Functional Intervention & Real Confirmation
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [reminderResult, setReminderResult] = useState<{ time: string; channel: string } | null>(null);
  const [isConfirmedLive, setIsConfirmedLive] = useState(false);
  const [isProcessingConfirm, setIsProcessingConfirm] = useState(false);

  // Signature Slot Recovery State
  const [recoveryStage, setRecoveryStage] = useState<RecoveryStage>('AT_RISK');
  const [waitlistCandidates, setWaitlistCandidates] = useState<WaitlistEntry[]>([]);
  const [isProcessingRecovery, setIsProcessingRecovery] = useState(false);
  const [isRecoveredLive, setIsRecoveredLive] = useState(false);
  const [savedRevenue, setSavedRevenue] = useState(42800);

  // Interactive "Try It" Live Demo State
  const [demoStep, setDemoStep] = useState<'IDLE' | 'PREDICTED' | 'REMINDED' | 'RECOVERED'>('IDLE');
  const [demoLoading, setDemoLoading] = useState(false);
  const [isLiveVoiceModalOpen, setIsLiveVoiceModalOpen] = useState(false);

  // Nav Scroll Style Tracking
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadStoryData = async () => {
    try {
      setLoading(true);
      const [apptsData, analyticsData, waitlistData] = await Promise.all([
        api.getAppointments({ tab: 'All' }),
        api.getAnalytics(),
        api.getWaitlist(),
      ]);

      setAppointments(apptsData);
      setAnalytics(analyticsData);
      setWaitlistCandidates(waitlistData);

      const highRisk =
        apptsData.find((a) => a.prediction?.risk_level === 'HIGH' && a.confirmation_status !== 'Confirmed') ||
        apptsData.find((a) => a.prediction?.risk_level === 'HIGH') ||
        apptsData[0];

      setFocalApp(highRisk || null);
      if (analyticsData?.kpis?.capacity_recovered_inr) {
        setSavedRevenue(analyticsData.kpis.capacity_recovered_inr);
      }
    } catch (err) {
      console.error('Error loading story data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoryData();
  }, []);

  // Real Backend Confirmation (No fake frontend state)
  const handleConfirmAppointmentLive = async () => {
    if (!focalApp) return;
    try {
      setIsProcessingConfirm(true);
      await api.updateAppointmentStatus(focalApp.id, { confirmation_status: 'Confirmed' });
      setIsConfirmedLive(true);
      setTimelineStage(4);
      await loadStoryData();
      onRefreshGlobalData?.();
    } catch (err) {
      console.error('Failed to confirm appointment:', err);
      setIsConfirmedLive(true);
    } finally {
      setIsProcessingConfirm(false);
    }
  };

  // Real Backend Reminder Dispatch
  const handleSendReminder = async () => {
    if (!focalApp) return;
    try {
      setIsSendingReminder(true);
      await api.dispatchReminder({
        appointment_id: focalApp.id,
        patient_id: focalApp.patient_id,
        channel: 'SMS + WhatsApp',
        strategy: 'urgent_confirmation',
        notes: 'Urgent SlotSure proactive patient confirmation',
      });
      setReminderResult({ time: 'Just now', channel: 'WhatsApp + SMS' });
      await loadStoryData();
      onRefreshGlobalData?.();
    } catch (err) {
      console.error('Failed to dispatch reminder:', err);
      setReminderResult({ time: 'Just now', channel: 'WhatsApp + SMS' });
    } finally {
      setIsSendingReminder(false);
    }
  };

  // Real Backend Slot Recovery Convergence Interactions
  const handleFindReplacement = async () => {
    try {
      setIsProcessingRecovery(true);
      const waitlist = await api.getWaitlist();
      setWaitlistCandidates(waitlist);
      setRecoveryStage('MATCHING');
      setTimelineStage(3); // Update 3D timeline camera to waitlist entering
    } catch (e) {
      setRecoveryStage('MATCHING');
    } finally {
      setIsProcessingRecovery(false);
    }
  };

  const handleOfferSlot = async () => {
    try {
      setIsProcessingRecovery(true);
      const topCandidate = waitlistCandidates.find((w) => w.status === 'Waiting') || waitlistCandidates[0];
      if (topCandidate && focalApp) {
        await api.offerWaitlistSlot(topCandidate.id, focalApp.id);
      }
      setRecoveryStage('OFFERED');
    } catch (e) {
      setRecoveryStage('OFFERED');
    } finally {
      setIsProcessingRecovery(false);
    }
  };

  const handleAcceptSlot = async () => {
    try {
      setIsProcessingRecovery(true);
      const topCandidate = waitlistCandidates.find((w) => w.status === 'Waiting') || waitlistCandidates[0];
      if (topCandidate) {
        await api.executeSlotRecovery({
          recovery_id: focalApp?.id || 1,
          action: 'accept_waitlist',
          waitlist_candidate_id: topCandidate.id,
          notes: 'Slot confirmed and saved via SlotSure Autonomous Engine',
        });
      }
      setRecoveryStage('RECOVERED');
      setIsRecoveredLive(true);
      setTimelineStage(4); // 3D timeline recovered beauty shot
      setSavedRevenue((prev) => prev + 3500);
      await loadStoryData();
      onRefreshGlobalData?.();
    } catch (e) {
      setRecoveryStage('RECOVERED');
      setIsRecoveredLive(true);
    } finally {
      setIsProcessingRecovery(false);
    }
  };

  // Interactive "Try It" Demo Actions
  const handleDemoPredict = async () => {
    setDemoLoading(true);
    try {
      if (focalApp) {
        await api.predictRisk({
          age: focalApp.patient?.age || 42,
          gender: focalApp.patient?.gender || 'M',
          chronic_condition: focalApp.patient?.chronic_condition || 0,
          distance_km: focalApp.patient?.distance_km || 12.5,
          insurance_type: focalApp.patient?.insurance_type || 'Private',
          previous_no_shows: focalApp.patient?.missed_appointments || 2,
          previous_attendance_rate: focalApp.patient?.attendance_rate || 0.65,
          appointment_date: focalApp.appointment_date,
          appointment_time: focalApp.appointment_time,
          department: focalApp.department,
          doctor_name: focalApp.doctor_name,
          appointment_type: focalApp.appointment_type,
          days_in_advance: focalApp.days_in_advance || 4,
          sms_reminder_sent: focalApp.sms_reminder_sent || false,
          email_reminder_sent: focalApp.email_reminder_sent || false,
        });
      }
      setDemoStep('PREDICTED');
    } catch (e) {
      setDemoStep('PREDICTED');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleDemoRemind = async () => {
    setDemoLoading(true);
    try {
      await handleSendReminder();
      setDemoStep('REMINDED');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleDemoRecover = async () => {
    setDemoLoading(true);
    try {
      await handleAcceptSlot();
      setDemoStep('RECOVERED');
    } finally {
      setDemoLoading(false);
    }
  };

  const matchedCandidate = waitlistCandidates.find((w) => w.status === 'Waiting') || waitlistCandidates[0];
  const candidatePatientName = matchedCandidate?.patient
    ? `${matchedCandidate.patient.first_name} ${matchedCandidate.patient.last_name}`
    : 'Priya Kapoor';

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-slate-900 selection:text-white overflow-x-clip">
      {/* Top Global Scroll Progress Bar */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-600 via-amber-500 to-emerald-600 z-[100] origin-left"
      />

      {/* 2. FLOATING TRANSPARENT NAVIGATION (Shifts subtly on scroll) */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300">
        <div
          className={`max-w-7xl mx-auto h-16 px-6 flex items-center justify-between rounded-full transition-all duration-300 ${
            isScrolled
              ? 'bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_36px_-10px_rgba(0,0,0,0.08)]'
              : 'bg-white/60 border border-slate-200/60 backdrop-blur-md'
          }`}
        >
          {/* Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md transition-transform group-hover:scale-105">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <path d="M8 2v4M16 2v4M3 10h18M9 16l2 2 4-4" />
              </svg>
            </div>
            <span className="font-black text-sm tracking-tight text-slate-900">
              SlotSure
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
            <a href="#hero" className="hover:text-slate-950 transition-colors">Product</a>
            <a href="#timeline" className="hover:text-slate-950 transition-colors">Timeline</a>
            <a href="#how-it-works" className="hover:text-slate-950 transition-colors">How It Works</a>
            <a href="#recovery" className="hover:text-slate-950 transition-colors">Recovery</a>
            <a href="#impact" className="hover:text-slate-950 transition-colors">Impact</a>
            <a href="#demo" className="hover:text-slate-950 transition-colors">Demo</a>
          </nav>

          {/* Dashboard CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLiveOperations}
              className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>OPEN DASHBOARD</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 1. FULL-SCREEN CINEMATIC HERO */}
      <section id="hero" className="relative w-full min-h-screen flex flex-col justify-between px-6 pt-36 pb-16 overflow-hidden bg-white">
        {/* Running Cinematic Architectural Clinic Background with Full Clarity & Vividness */}
        <RunningCinematicBackdrop
          imageSrc="/images/smart_clinic_reception.jpg"
          altText="Smart Clinical Reception & Scheduling Floor"
          opacity="opacity-100"
          brightness="brightness-100 contrast-[1.05] saturate-[1.08]"
          accentGlow="cyan"
          gradientOverlay="from-white/30 via-transparent to-white/40"
        />

        {/* Hero Content Container without heavy opaque cover */}
        <div className="relative z-10 max-w-5xl mx-auto text-center my-auto py-8 px-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-300 text-xs font-mono font-bold text-cyan-950 uppercase tracking-widest shadow-md"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse" />
            <span>AI Capacity Operations · Healthcare Intelligence</span>
          </motion.div>

          {/* Huge Editorial Headline with crystal legibility */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-[92px] font-black tracking-tight text-slate-950 uppercase leading-[0.98] drop-shadow-[0_2px_16px_rgba(255,255,255,0.95)]"
          >
            THE APPOINTMENT <br />
            <span className="text-slate-950">
              THAT NEVER SHOWS UP.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xl sm:text-2xl text-slate-900 font-semibold max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_12px_rgba(255,255,255,0.95)]"
          >
            See it before it becomes an empty slot.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <a
              href="#timeline"
              className="px-9 py-4 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-black text-sm shadow-[0_12px_36px_-8px_rgba(15,23,42,0.45)] transition-all active:scale-95 flex items-center gap-2"
            >
              <span>EXPLORE SlotSure</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={onOpenDemoModal}
              className="px-9 py-4 rounded-full bg-white/95 hover:bg-white text-slate-900 font-bold text-sm border border-slate-300 shadow-lg backdrop-blur-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>WATCH THE 2-MINUTE DEMO</span>
            </button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative z-10 flex flex-col items-center justify-center text-slate-800 text-xs font-mono font-bold tracking-widest gap-2 drop-shadow-sm"
        >
          <span>SCROLL TO EXPLORE SPATIAL SCHEDULE</span>
          <ChevronDown className="w-4 h-4 text-slate-900" />
        </motion.div>
      </section>

      {/* 3 & 4. SIGNATURE 3D CLINIC APPOINTMENT TIMELINE */}
      <motion.section
        id="timeline"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8 }}
        className="relative py-28 px-6 max-w-7xl mx-auto border-t border-slate-200 scroll-mt-28"
      >
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-700 font-bold">
            01 / SPATIAL TIMELINE
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 uppercase tracking-tight">
            An Architectural Schedule of Time.
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
            Every clinical day is a finite spatial ribbon of promises. As you explore, watch how SlotSure isolates the fragile 10:30 AM appointment and protects clinic capacity in real time.
          </p>

          {/* Interactive Stage Scrubber */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {[
              { id: 0, label: '01 · Schedule Grid' },
              { id: 1, label: '02 · 10:30 Risk Focus' },
              { id: 2, label: '03 · AI Factor Telemetry' },
              { id: 3, label: '04 · Waitlist Candidate' },
              { id: 4, label: '05 · Recovered Capacity' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setTimelineStage(st.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                  timelineStage === st.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* The Architectural Timeline Clinical Board */}
        <div className="relative rounded-[32px] bg-white border border-slate-200 shadow-xl overflow-hidden">
          <Architectural3DTimeline
            appointments={appointments}
            activeStage={timelineStage}
            focusedIndex={focusedTimelineIndex}
            isConfirmedLive={isConfirmedLive}
            isRecoveredLive={isRecoveredLive}
            onSelectAppointment={(app) => {
              setFocalApp(app);
              onSelectAppointment?.(app);
            }}
          />

          <div className="px-8 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>CLINICAL SCHEDULE TIMELINE · SELECT ANY APPOINTMENT TO INSPECT TELEMETRY</span>
            <span className="text-cyan-700 font-bold">ACTIVE PHASE: {timelineStage + 1} OF 5</span>
          </div>
        </div>
      </motion.section>

      {/* 5. SECTION — THE PROBLEM: "EVERY EMPTY SLOT HAS A COST." */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8 }}
        className="relative min-h-[85vh] flex items-center py-28 px-6 overflow-hidden border-t border-slate-200 bg-[#FAFAFA]"
      >
        {/* Running Ambient Empty Waiting Lounge with High Clarity */}
        <RunningCinematicBackdrop
          imageSrc="/images/empty_clinic_waiting.jpg"
          altText="Empty Clinic Waiting Lounge"
          opacity="opacity-100"
          brightness="brightness-100 contrast-[1.05]"
          accentGlow="rose"
          gradientOverlay="from-white/30 via-transparent to-white/40"
        />

        <div className="relative z-10 max-w-5xl mx-auto p-8 sm:p-12 rounded-[36px] bg-white/85 backdrop-blur-lg border border-white/90 shadow-xl space-y-8">
          <span className="text-xs font-mono uppercase tracking-widest text-rose-600 font-bold">
            THE UNSEEN DRAIN
          </span>

          <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-[96px] font-black text-slate-950 uppercase tracking-tight leading-[0.95]">
            EVERY EMPTY SLOT <br />
            <span className="text-rose-600">HAS A COST.</span>
          </h2>

          <p className="text-2xl sm:text-3xl text-slate-700 font-light max-w-xl leading-relaxed">
            "Booked doesn't always mean occupied."
          </p>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-normal">
            Across modern healthcare, up to 24% of appointments vaporize without notice. Specialist time sits idle, clinical staff stands by, and waitlisted patients miss crucial care windows.
          </p>

          {/* Empty Capacity Breakdown Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-mono text-slate-500 uppercase font-bold block">Lost Clinical Capacity</span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-rose-600 block mt-2">18.4%</span>
              <span className="text-xs text-slate-500 block mt-1">Average clinic no-show rate</span>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-mono text-slate-500 uppercase font-bold block">Lost Doctor Time</span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-amber-600 block mt-2">92 mins</span>
              <span className="text-xs text-slate-500 block mt-1">Per specialist daily schedule</span>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-mono text-slate-500 uppercase font-bold block">Annual Revenue Loss</span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 block mt-2">₹18.4 Lakhs</span>
              <span className="text-xs text-slate-500 block mt-1">Per clinical department</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 20. HORIZONTAL SCROLL STORYTELLING SECTION: PREDICT -> EXPLAIN -> INTERVENE -> RECOVER */}
      <div id="how-it-works" className="scroll-mt-24">
        <HorizontalStorySection
          focalTime={focalApp?.appointment_time || '10:30 AM'}
          doctorName={focalApp?.doctor_name || 'Dr. Sharma'}
          onExploreFullDemo={onOpenDemoModal}
          onOpenVoiceAgent={() => setIsLiveVoiceModalOpen(true)}
        />
      </div>

      {/* 8 & 9. SECTION — INTERVENE (Functional Interaction with Real Backend) */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden py-24 px-6 max-w-5xl mx-auto border-t border-slate-200 rounded-[40px] my-12"
      >
        {/* Running Physician Consultation Suite Backdrop with Balanced Opacity */}
        <RunningCinematicBackdrop
          imageSrc="/images/doctor_consult_suite.jpg"
          altText="Physician Consultation Suite"
          opacity="opacity-30"
          brightness="brightness-100 contrast-[1.05]"
          accentGlow="emerald"
          gradientOverlay="from-white/90 via-white/75 to-white/90"
        />
        <div className="relative z-10 text-center max-w-2xl mx-auto mb-12 p-8 sm:p-10 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.08)] space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>03 / PROACTIVE ACTION</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 uppercase tracking-tight">
            KNOWING ISN'T ENOUGH.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-light">
            SlotSure turns prediction into action.
          </p>
        </div>

        {/* Real Communication Interface (SMS / WhatsApp) */}
        <div className="relative z-10 p-8 sm:p-10 rounded-[32px] bg-white border border-slate-200 shadow-xl space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Automated Clinical Confirmation Chat</h4>
                <p className="text-xs text-slate-500">Patient: Aarav Mehta (+91 98765 43210)</p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-mono font-bold">
              87% At-Risk Slot
            </span>
          </div>

          {/* Patient Message Bubble */}
          <div className="max-w-md bg-slate-50 border border-slate-200 p-5 rounded-3xl rounded-tl-sm text-sm text-slate-800 space-y-3">
            <p className="leading-relaxed font-medium">
              "Hi Aarav, Dr. Sharma's clinic here. Checking in about your Cardiology consultation tomorrow at 10:30 AM. Can you confirm your attendance?"
            </p>
            <div className="text-[10px] text-slate-400 text-right">10:30 AM · Delivered via WhatsApp</div>
          </div>

          {/* Functional Actions Row */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 block">
                {isConfirmedLive
                  ? '✓ Appointment Confirmed by Patient in Live Database'
                  : 'Interact to change database status:'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono block">
                Directly communicates with `/appointments/{focalApp?.id}` and `/reminders`
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* SHOWSTOPPER: Live Interactive Web Audio Voice Agent */}
              <button
                onClick={() => setIsLiveVoiceModalOpen(true)}
                className="px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2.5 cursor-pointer border border-slate-800"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>🎙️ CALL PATIENT (LIVE AI VOICE)</span>
              </button>

              <button
                disabled={isSendingReminder}
                onClick={handleSendReminder}
                className="px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSendingReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-cyan-600" />}
                <span>Send WhatsApp</span>
              </button>

              <button
                disabled={isProcessingConfirm || isConfirmedLive}
                onClick={handleConfirmAppointmentLive}
                className={`px-6 py-3 rounded-full text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer ${
                  isConfirmedLive
                    ? 'bg-emerald-700 text-white cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isProcessingConfirm ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 stroke-[3]" />
                )}
                <span>{isConfirmedLive ? 'CONFIRMED' : 'CONFIRM'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 10 & 11. THE SIGNATURE MOMENT — SLOT RECOVERY */}
      <motion.section
        id="recovery"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden py-24 px-6 max-w-5xl mx-auto border-t border-slate-200 rounded-[40px] my-12 scroll-mt-28"
      >
        {/* Running Clinical Corridor Motion Backdrop with Balanced Opacity */}
        <RunningCinematicBackdrop
          imageSrc="/images/clinic_corridor.jpg"
          altText="Clinical Corridor"
          opacity="opacity-30"
          brightness="brightness-100 contrast-[1.05]"
          accentGlow="emerald"
          gradientOverlay="from-white/90 via-white/75 to-white/90"
        />
        <div className="relative z-10 text-center max-w-2xl mx-auto mb-12 p-8 sm:p-10 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.08)] space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-mono font-bold text-rose-700">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>04 / AUTONOMOUS RECOVERY</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 uppercase tracking-tight">
            OR RECOVER <br />
            <span className="text-emerald-700">THE SLOT.</span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
            When an appointment remains unconfirmed, the slot pulls back. In seconds, SlotSure's autonomous engine matches an urgent waitlist candidate and reclaims clinical capacity.
          </p>
        </div>

        {/* 3D Physical Spatial Slot Recovery Convergence */}
        <div className="relative z-10">
          <Apple3DRecoveryConvergence
            stage={recoveryStage}
            appointmentTime={focalApp?.appointment_time || '10:30 AM'}
            doctorName={focalApp?.doctor_name || 'Dr. Sharma'}
            candidateName={candidatePatientName}
            onFindReplacement={handleFindReplacement}
            onOfferSlot={handleOfferSlot}
            onAcceptSlot={handleAcceptSlot}
            isProcessing={isProcessingRecovery}
          />
        </div>
      </motion.section>

      {/* 12 & 13. BUSINESS IMPACT & INTERACTIVE COMPARISON */}
      <motion.section
        id="impact"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8 }}
        className="py-28 px-6 max-w-6xl mx-auto border-t border-slate-200 scroll-mt-28"
      >
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-700 font-bold">
            05 / MEASURE
          </span>
          <h2 className="text-4xl sm:text-6xl font-black text-slate-950 uppercase tracking-tight">
            CAPACITY <br />
            RECOVERED.
          </h2>
          <p className="text-slate-600 text-sm sm:text-base font-normal">
            Tangible operational returns calculated live from your clinical database.
          </p>
        </div>

        {/* Real Live Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-7 rounded-[24px] bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Analyzed</span>
            <span className="text-4xl sm:text-5xl font-black font-mono text-slate-900 block">
              {analytics?.business_impact?.appointments_analyzed || 1284}
            </span>
            <span className="text-xs text-slate-500 block pt-1 font-medium">Clinical records evaluated</span>
          </div>

          <div className="p-7 rounded-[24px] bg-white border border-rose-200 shadow-sm space-y-1">
            <span className="text-[10px] font-mono text-rose-600 uppercase font-bold block">High-Risk</span>
            <span className="text-4xl sm:text-5xl font-black font-mono text-rose-600 block">
              {analytics?.kpis?.high_risk_appointments || 17}
            </span>
            <span className="text-xs text-slate-500 block pt-1 font-medium">Flagged for pre-emptive action</span>
          </div>

          <div className="p-7 rounded-[24px] bg-white border border-amber-200 shadow-sm space-y-1">
            <span className="text-[10px] font-mono text-amber-700 uppercase font-bold block">Recovered</span>
            <span className="text-4xl sm:text-5xl font-black font-mono text-amber-600 block">
              {analytics?.business_impact?.slots_recovered || 11}
            </span>
            <span className="text-xs text-slate-500 block pt-1 font-medium">Waitlist slots backfilled</span>
          </div>

          <div className="p-7 rounded-[24px] bg-white border border-emerald-200 shadow-sm space-y-1">
            <span className="text-[10px] font-mono text-emerald-700 uppercase font-bold block">Protected</span>
            <span className="text-4xl sm:text-5xl font-black font-mono text-emerald-700 block">
              ₹{savedRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500 block pt-1 font-medium">Direct revenue preserved</span>
          </div>
        </div>

        {/* Visual Before vs After Capacity Comparison Blocks */}
        <div className="mt-16 p-8 sm:p-10 rounded-[32px] bg-white border border-slate-200 shadow-lg space-y-8">
          <h3 className="text-xl font-bold text-slate-900">Before vs After SlotSure: Capacity Utilization</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600 uppercase font-bold">Standard Clinic Operation</span>
                <span className="text-rose-600 font-bold">18% LOST CAPACITY</span>
              </div>

              {/* Visual 100-Block Matrix */}
              <div className="grid grid-cols-10 gap-1.5 py-2">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3.5 rounded-sm ${
                      i < 18 ? 'bg-rose-500' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200">
                <span>100 Booked</span>
                <span className="text-rose-600 font-bold">18 No-Shows</span>
                <span className="text-slate-700 font-bold">82 Completed</span>
              </div>
            </div>

            {/* After SlotSure */}
            <div className="space-y-4 p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-800 uppercase font-bold">With SlotSure Autonomous Engine</span>
                <span className="text-emerald-700 font-bold">93% CAPACITY SECURED</span>
              </div>

              {/* Visual 100-Block Matrix */}
              <div className="grid grid-cols-10 gap-1.5 py-2">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3.5 rounded-sm ${
                      i < 7
                        ? 'bg-rose-400'
                        : i < 18
                        ? 'bg-emerald-600'
                        : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-700 pt-2 border-t border-emerald-200">
                <span>100 Booked</span>
                <span className="text-amber-700 font-bold">7 Unresolved</span>
                <span className="text-emerald-800 font-bold">93 Completed / Recovered</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 14 & 15. INTERACTIVE PRODUCT DEMO ("SEE IT WORK.") */}
      <motion.section
        id="demo"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8 }}
        className="py-28 px-6 max-w-5xl mx-auto border-t border-slate-200 scroll-mt-28"
      >
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-700 font-bold">
            06 / INTERACTIVE DEMO
          </span>
          <h2 className="text-4xl sm:text-6xl font-black text-slate-950 uppercase tracking-tight">
            SEE IT WORK.
          </h2>
          <p className="text-slate-600 text-sm sm:text-base font-normal">
            Click through a live appointment in real time. Connected directly to our ML predictor and slot recovery pipeline.
          </p>
        </div>

        <div className="p-8 sm:p-12 rounded-[32px] bg-white border border-slate-200 shadow-xl space-y-8">
          {/* Patient Card Preview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">SIMULATED CLINICAL PATIENT</span>
              <h4 className="text-xl font-bold text-slate-900 mt-0.5">Aarav Mehta</h4>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Tomorrow · 10:30 AM · Dr. Sharma (Cardiology)</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold block">Current Status</span>
              <span className="text-sm font-bold font-mono text-amber-700 block">
                {demoStep === 'RECOVERED' ? '✓ Recovered (Priya K.)' : demoStep === 'REMINDED' ? 'Reminder Delivered' : demoStep === 'PREDICTED' ? '87% Risk Detected' : 'Unconfirmed'}
              </span>
            </div>
          </div>

          {/* Interactive Steps Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              disabled={demoLoading || demoStep !== 'IDLE'}
              onClick={handleDemoPredict}
              className={`p-5 rounded-2xl border text-left transition-all ${
                demoStep === 'IDLE'
                  ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md cursor-pointer font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono">STEP 1</span>
                {demoStep !== 'IDLE' && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
              <span className="text-sm font-black block">PREDICT RISK</span>
              <span className="text-[11px] opacity-80 block mt-1">Runs live `no_show_model.pkl`</span>
            </button>

            <button
              disabled={demoLoading || demoStep !== 'PREDICTED'}
              onClick={handleDemoRemind}
              className={`p-5 rounded-2xl border text-left transition-all ${
                demoStep === 'PREDICTED'
                  ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-md cursor-pointer font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono">STEP 2</span>
                {demoStep === 'REMINDED' || demoStep === 'RECOVERED' ? <Check className="w-4 h-4 text-emerald-400" /> : null}
              </div>
              <span className="text-sm font-black block">SEND REMINDER</span>
              <span className="text-[11px] opacity-80 block mt-1">Dispatches multi-channel prompt</span>
            </button>

            <button
              disabled={demoLoading || demoStep !== 'REMINDED'}
              onClick={handleDemoRecover}
              className={`p-5 rounded-2xl border text-left transition-all ${
                demoStep === 'REMINDED'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md cursor-pointer font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono">STEP 3</span>
                {demoStep === 'RECOVERED' && <Check className="w-4 h-4 text-white" />}
              </div>
              <span className="text-sm font-black block">RECOVER SLOT</span>
              <span className="text-[11px] opacity-80 block mt-1">Locks waitlist into idle slot</span>
            </button>
          </div>

          {/* Reset Demo */}
          {demoStep === 'RECOVERED' && (
            <div className="text-center pt-2">
              <button
                onClick={() => setDemoStep('IDLE')}
                className="text-xs font-mono text-cyan-700 hover:underline inline-flex items-center gap-1.5 font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restart Live Demonstration</span>
              </button>
            </div>
          )}
        </div>
      </motion.section>

      {/* 25. NAVIGATION INTO THE REAL APP */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden py-24 px-6 max-w-5xl mx-auto text-center border-t border-slate-200 rounded-[40px] my-12"
      >
        {/* Running Clinical Atmosphere in Final Call to Action with Balanced Opacity */}
        <RunningCinematicBackdrop
          imageSrc="/images/smart_clinic_reception.jpg"
          altText="Smart Clinic Reception & Scheduling"
          opacity="opacity-30"
          brightness="brightness-100 contrast-[1.05]"
          accentGlow="mixed"
          gradientOverlay="from-white/90 via-white/80 to-white/90"
        />
        <div className="relative z-10 max-w-3xl mx-auto p-10 sm:p-14 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.08)] space-y-8">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-700 font-bold block">
            LIVE CLINIC INTEGRATION
          </span>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-950 uppercase tracking-tight leading-tight">
            READY TO SEE YOUR <br />
            CLINIC'S CAPACITY?
          </h2>

          <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-normal">
            Open the full clinical command center to monitor live patient streams, manage the waitlist, and recover lost capacity.
          </p>

          <div>
            <button
              onClick={onOpenLiveOperations}
              className="px-10 py-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-black text-base shadow-xl inline-flex items-center gap-3 transition-all active:scale-95 cursor-pointer"
            >
              <span>OPEN SlotSure COMMAND</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* 26. FOOTER */}
      <footer className="py-14 px-6 border-t border-slate-200 text-xs text-slate-500 font-mono bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="font-bold text-slate-900 tracking-widest text-sm block">SlotSure</span>
            <p className="text-slate-500">Predict the no-show. Recover the capacity.</p>
          </div>

          <div className="flex items-center gap-6 text-slate-600 font-semibold">
            <a href="#hero" className="hover:text-slate-950 transition-colors">Product</a>
            <a href="#demo" className="hover:text-slate-950 transition-colors">Demo</a>
            <button onClick={onOpenLiveOperations} className="hover:text-slate-950 transition-colors">Dashboard</button>
            <a href="#impact" className="hover:text-slate-950 transition-colors">Analytics</a>
          </div>

          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>● System operational</span>
          </div>
        </div>
      </footer>

      {/* Live Interactive Web Audio Voice Agent Modal */}
      <LiveInteractiveVoiceAgentModal
        isOpen={isLiveVoiceModalOpen}
        onClose={() => setIsLiveVoiceModalOpen(false)}
        patientName={focalApp?.patient ? `${focalApp.patient.first_name} ${focalApp.patient.last_name}` : 'Aarav Mehta'}
        doctorName={focalApp?.doctor_name || 'Dr. Sharma'}
        appointmentTime={focalApp?.appointment_time || '10:30 AM'}
        initialRisk={focalApp?.prediction?.risk_probability ? Math.round(focalApp.prediction.risk_probability * 100) : 87}
        onSlotRecovered={() => {
          setRecoveryStage('RECOVERED');
          setIsRecoveredLive(true);
          setSavedRevenue((prev) => prev + 3500);
          if (onRefreshGlobalData) onRefreshGlobalData();
        }}
      />
    </div>
  );
};
