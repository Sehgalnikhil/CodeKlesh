import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import {
  Send,
  ChevronRight,
  ChevronLeft,
  Activity,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';
import { RunningCinematicBackdrop } from '../ui/RunningCinematicBackdrop';

interface HorizontalStorySectionProps {
  focalTime?: string;
  doctorName?: string;
  onExploreFullDemo?: () => void;
  onOpenVoiceAgent?: () => void;
}

export const HorizontalStorySection: React.FC<HorizontalStorySectionProps> = ({
  doctorName = 'Dr. Sharma',
  onExploreFullDemo,
  onOpenVoiceAgent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activePhase, setActivePhase] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [scrollDistance, setScrollDistance] = useState<number>(0);

  const isDown = useRef(false);
  const startX = useRef(0);
  const startScrollY = useRef(0);

  const phases = [
    {
      id: 0,
      number: '01',
      tag: '01 / PREDICT',
      title: 'Predict Risk',
      eyebrow: 'REAL-TIME ML INFERENCE',
      headline: 'SEE THE RISK BEFORE SUNRISE.',
      color: 'cyan',
    },
    {
      id: 1,
      number: '02',
      tag: '02 / EXPLAIN',
      title: 'Explainable AI',
      eyebrow: 'TELEMETRY ATTRIBUTION',
      headline: 'DECONSTRUCTING THE REASON.',
      color: 'amber',
    },
    {
      id: 2,
      number: '03',
      tag: '03 / INTERVENE',
      title: 'Intervention',
      eyebrow: 'PROACTIVE MULTI-CHANNEL ACTION',
      headline: 'INTERVENTION BEFORE VACANCY.',
      color: 'emerald',
    },
    {
      id: 3,
      number: '04',
      tag: '04 / RECOVER',
      title: 'Slot Recovery',
      eyebrow: 'AUTONOMOUS WAITLIST BACKFILL',
      headline: 'ZERO DEAD TIME. CAPACITY RESTORED.',
      color: 'emerald',
    },
  ];

  // Vertical scroll tracking on the 320vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Calculate required horizontal translation based on actual rendered track width
  useEffect(() => {
    const updateDistance = () => {
      if (trackRef.current) {
        const totalTrackWidth = trackRef.current.scrollWidth;
        const visibleWidth = window.innerWidth;
        const padding = window.innerWidth < 768 ? 32 : 80;
        const maxDist = Math.max(0, totalTrackWidth - visibleWidth + padding);
        setScrollDistance(maxDist);
      }
    };

    updateDistance();
    window.addEventListener('resize', updateDistance);
    const t1 = setTimeout(updateDistance, 150);
    const t2 = setTimeout(updateDistance, 600);
    const t3 = setTimeout(updateDistance, 1200);
    return () => {
      window.removeEventListener('resize', updateDistance);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Map vertical scroll progress to horizontal translation
  const rawX = useTransform(scrollYProgress, (progress) => -progress * scrollDistance);
  const x = useSpring(rawX, {
    damping: 30,
    stiffness: 180,
    mass: 0.15,
  });

  // Sync active phase state with scroll progress
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    setScrollProgress(latest);
    if (latest < 0.22) {
      setActivePhase(0);
    } else if (latest < 0.50) {
      setActivePhase(1);
    } else if (latest < 0.78) {
      setActivePhase(2);
    } else {
      setActivePhase(3);
    }
  });

  // Smooth jump to any phase along the vertical scroll track
  const scrollToPhase = (targetIndex: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
    const sectionTop = currentScrollY + rect.top;
    const scrollableRange = containerRef.current.offsetHeight - window.innerHeight;

    const phaseOffsets = [0, 0.333, 0.666, 1.0];
    const targetOffset = phaseOffsets[targetIndex] ?? (targetIndex / 3);
    const targetY = sectionTop + targetOffset * scrollableRange;

    window.scrollTo({
      top: targetY,
      behavior: 'smooth',
    });
  };

  const nextPhase = () => {
    if (activePhase < 3) scrollToPhase(activePhase + 1);
  };

  const prevPhase = () => {
    if (activePhase > 0) scrollToPhase(activePhase - 1);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const containerRect = containerRef.current.getBoundingClientRect();
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
    const sectionTop = currentScrollY + containerRect.top;
    const scrollableRange = containerRef.current.offsetHeight - window.innerHeight;

    window.scrollTo({
      top: sectionTop + ratio * scrollableRange,
      behavior: 'smooth',
    });
  };

  // Support trackpad horizontal gestures by mapping deltaX to vertical scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && containerRef.current && scrollDistance > 0) {
      const scrollableRange = containerRef.current.offsetHeight - window.innerHeight;
      const scrollAmount = (e.deltaX / scrollDistance) * scrollableRange;
      window.scrollBy({ top: scrollAmount, behavior: 'auto' });
    }
  };

  // Support horizontal mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || scrollDistance <= 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) return;

    isDown.current = true;
    startX.current = e.pageX;
    startScrollY.current = window.pageYOffset || document.documentElement.scrollTop;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !containerRef.current || scrollDistance <= 0) return;
    const dx = e.pageX - startX.current;
    const scrollableRange = containerRef.current.offsetHeight - window.innerHeight;
    const scrollDelta = (-dx / scrollDistance) * scrollableRange;
    window.scrollTo({ top: startScrollY.current + scrollDelta, behavior: 'auto' });
  };

  const handleMouseUp = () => {
    isDown.current = false;
  };

  return (
    <section
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative h-[320vh] bg-white text-slate-900 select-none"
    >
      {/* Pinned Sticky Viewport Container */}
      <div className="sticky top-0 h-screen flex flex-col justify-between pt-20 sm:pt-24 pb-6 px-4 sm:px-8 max-w-[1500px] mx-auto overflow-hidden">
        {/* 1. Header & Quick Scrubber */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200/80 flex-shrink-0">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse" />
              <span>INTERACTIVE HORIZONTAL STORY SEQUENCE · 4 PHASES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-950">
              From Risk to Recovered Capacity
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl font-normal">
              Scroll down naturally to glide through the clinical recovery phases, or use phase tabs to jump.
            </p>
          </div>

          {/* Quick-Jump Phase Tabs and Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-100/90 border border-slate-200/80 shadow-sm backdrop-blur-md">
              {phases.map((phase, idx) => (
                <button
                  key={phase.id}
                  onClick={() => scrollToPhase(idx)}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
                    activePhase === idx
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <span>{phase.tag}</span>
                </button>
              ))}
            </div>

            {/* Prev / Next Arrow Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevPhase}
                disabled={activePhase === 0}
                className="w-9 h-9 rounded-full border border-slate-300 bg-white hover:bg-slate-900 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-800 shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Previous Phase"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextPhase}
                disabled={activePhase === 3}
                className="w-9 h-9 rounded-full border border-slate-300 bg-white hover:bg-slate-900 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-800 shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Next Phase"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Horizontal Scroll Track Driven by Vertical Window Scroll */}
        <div className="relative flex-1 flex items-center overflow-hidden py-2 sm:py-4">
          <motion.div
            ref={trackRef}
            style={{ x }}
            className="flex gap-6 sm:gap-8 items-stretch will-change-transform cursor-grab active:cursor-grabbing"
          >
            {/* ========================================================
                PHASE 01: PREDICT
               ======================================================== */}
            <div className="phase-card w-[88vw] sm:w-[82vw] md:w-[76vw] lg:w-[70vw] max-w-[1080px] h-[460px] sm:h-[490px] md:h-[510px] flex-shrink-0 rounded-[32px] bg-white border border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.06)] p-6 sm:p-8 md:p-10 relative overflow-y-auto sm:overflow-hidden flex flex-col justify-between">
              <RunningCinematicBackdrop
                imageSrc="/images/smart_clinic_reception.jpg"
                altText="Smart Clinic Phase 1"
                opacity="opacity-40"
                accentGlow="cyan"
                showParticles={false}
                gradientOverlay="from-white/75 via-white/60 to-white/75"
              />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
                {/* Left Content */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-mono font-bold text-cyan-800">
                    <span className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse" />
                    <span>PHASE 01 · REAL-TIME ML INFERENCE</span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-black text-slate-950 uppercase tracking-tight leading-[1.05]">
                    SEE THE RISK <br />
                    <span className="text-cyan-600">BEFORE SUNRISE.</span>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    Hours before clinical doors unlock, SlotSure's predictive engine computes attendance probability across every booked slot using patient attendance telemetry, lead-time gaps, and transit friction.
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500">
                    <span className="flex items-center gap-1.5 text-cyan-700 font-bold">
                      <Activity className="w-4 h-4" />
                      <span>ML Pipeline: 94.2% ROC-AUC</span>
                    </span>
                    <span>·</span>
                    <span>Inference Latency: 18ms</span>
                  </div>
                </div>

                {/* Right Card: High-Fidelity Slot Radar */}
                <div className="lg:col-span-6 flex justify-center">
                  <div className="w-full max-w-md p-5 sm:p-6 rounded-[24px] bg-white border border-slate-200 shadow-[0_16px_40px_-10px_rgba(15,23,42,0.08)] space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-black text-xs">
                          10:30
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900">Aarav Mehta</h4>
                          <p className="text-xs text-slate-500 font-medium">Cardiology · {doctorName}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono font-bold">
                        87% RISK
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono text-slate-600">
                        <span>Attendance Probability Risk</span>
                        <span className="text-rose-600 font-bold">CRITICAL ATTENTION</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500 w-[87%] rounded-full" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
                        <span className="text-slate-400 block text-[10px] font-bold">LEAD TIME</span>
                        <span className="text-slate-900 font-extrabold text-sm block mt-0.5">4 Days</span>
                        <span className="text-slate-500 block text-[10px] mt-0.5">+22% risk weight</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
                        <span className="text-slate-400 block text-[10px] font-bold">DISTANCE</span>
                        <span className="text-slate-900 font-extrabold text-sm block mt-0.5">14.5 km</span>
                        <span className="text-slate-500 block text-[10px] mt-0.5">Peak traffic corridor</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-cyan-50/80 border border-cyan-200/80 flex items-center justify-between text-xs font-mono text-cyan-900 font-bold">
                      <span>STATUS: UNCONFIRMED</span>
                      <button
                        onClick={nextPhase}
                        className="flex items-center gap-1.5 hover:text-cyan-700 bg-white/90 hover:bg-white px-3 py-1 rounded-full border border-cyan-300 shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <span>NEXT PHASE</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================
                PHASE 02: EXPLAIN
               ======================================================== */}
            <div className="phase-card w-[88vw] sm:w-[82vw] md:w-[76vw] lg:w-[70vw] max-w-[1080px] h-[460px] sm:h-[490px] md:h-[510px] flex-shrink-0 rounded-[32px] bg-white border border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.06)] p-6 sm:p-8 md:p-10 relative overflow-y-auto sm:overflow-hidden flex flex-col justify-between">
              <RunningCinematicBackdrop
                imageSrc="/images/clinical_smart_corridor.jpg"
                altText="Clinical Diagnostics Phase 2"
                opacity="opacity-40"
                accentGlow="amber"
                showParticles={false}
                gradientOverlay="from-white/75 via-white/60 to-white/75"
              />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
                {/* Left Content */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-mono font-bold text-amber-800">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>PHASE 02 · EXPLAINABLE AI ATTRIBUTION</span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-black text-slate-950 uppercase tracking-tight leading-[1.05]">
                    DECONSTRUCTING <br />
                    <span className="text-amber-600">THE REASON.</span>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    Black-box AI is unacceptable in clinical medicine. SlotSure isolates the exact vectors driving the risk score so clinicians understand why before taking proactive steps.
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500">
                    <span className="text-amber-800 font-bold">SHAP Confidence: 98.4%</span>
                    <span>·</span>
                    <span>Feature Space: 14 Variables Analyzed</span>
                  </div>
                </div>

                {/* Right Card: Feature Attribution Breakdown */}
                <div className="lg:col-span-6 space-y-2.5">
                  {[
                    {
                      title: 'PREVIOUS NO-SHOW RECORD',
                      weight: '+31%',
                      desc: '2 unnotified missed consultations in preceding 12 months',
                      pct: 88,
                    },
                    {
                      title: 'BOOKING LEAD GAP',
                      weight: '+22%',
                      desc: '4-day gap between reservation and clinical consultation',
                      pct: 65,
                    },
                    {
                      title: 'REMINDER ENGAGEMENT APATHY',
                      weight: '+18%',
                      desc: 'Past notifications delivered but unacknowledged',
                      pct: 54,
                    },
                    {
                      title: 'CROSS-DISTRICT TRANSIT',
                      weight: '+11%',
                      desc: '14.5 km distance with peak-hour morning friction',
                      pct: 35,
                    },
                  ].map((f, i) => (
                    <div
                      key={i}
                      className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-amber-400 transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>{f.title}</span>
                        <span className="font-mono text-amber-700 font-black">{f.weight}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                          style={{ width: `${f.pct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ========================================================
                PHASE 03: INTERVENE
               ======================================================== */}
            <div className="phase-card w-[88vw] sm:w-[82vw] md:w-[76vw] lg:w-[70vw] max-w-[1080px] h-[460px] sm:h-[490px] md:h-[510px] flex-shrink-0 rounded-[32px] bg-white border border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.06)] p-6 sm:p-8 md:p-10 relative overflow-y-auto sm:overflow-hidden flex flex-col justify-between">
              <RunningCinematicBackdrop
                imageSrc="/images/doctor_consult_suite.jpg"
                altText="Physician Consultation Phase 3"
                opacity="opacity-40"
                accentGlow="emerald"
                showParticles={false}
                gradientOverlay="from-white/75 via-white/60 to-white/75"
              />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
                {/* Left Content */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>PHASE 03 · PROACTIVE ACTION</span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-black text-slate-950 uppercase tracking-tight leading-[1.05]">
                    INTERVENTION <br />
                    <span className="text-emerald-600">BEFORE VACANCY.</span>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    SlotSure does not simply produce reports. It dispatches personalized, multi-channel clinical prompts via WhatsApp and SMS at the exact moment of patient receptivity.
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500">
                    <span className="text-emerald-800 font-bold">Two-Way Interactive Gateway</span>
                    <span>·</span>
                    <span>Automated Voice Fallback Ready</span>
                  </div>

                  {onOpenVoiceAgent && (
                    <button
                      onClick={onOpenVoiceAgent}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer mt-1"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>🎙️ CALL PATIENT (LIVE AI AGENT)</span>
                    </button>
                  )}
                </div>

                {/* Right Card: Clinical WhatsApp Simulator */}
                <div className="lg:col-span-6 flex justify-center">
                  <div className="w-full max-w-md p-5 sm:p-6 rounded-[24px] bg-white border border-slate-200 shadow-[0_16px_40px_-10px_rgba(16,185,129,0.12)] space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          <Send className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">Clinical WhatsApp Gateway</h4>
                          <p className="text-[11px] text-slate-500">Delivered to Aarav Mehta (+91 98765 43210)</p>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl rounded-tl-sm text-xs text-slate-800 space-y-2">
                      <p className="leading-relaxed font-medium">
                        "Hi Aarav, Dr. Sharma's clinic here. Checking in regarding your Cardiology consultation tomorrow at 10:30 AM. Can you confirm your attendance?"
                      </p>
                      <div className="text-[10px] text-slate-400 text-right">Delivered 10:30 AM · Verified Sent</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all">
                        CONFIRM (PATIENT)
                      </button>
                      <button className="py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs border border-slate-200 transition-all">
                        RESCHEDULE
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100">
                      <span>4-HOUR TIMEOUT SLA</span>
                      <span className="text-amber-700 font-bold">03:59:12 REMAINING</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================
                PHASE 04: RECOVER
               ======================================================== */}
            <div className="phase-card w-[88vw] sm:w-[82vw] md:w-[76vw] lg:w-[70vw] max-w-[1080px] h-[460px] sm:h-[490px] md:h-[510px] flex-shrink-0 rounded-[32px] bg-white border border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.06)] p-6 sm:p-8 md:p-10 relative overflow-y-auto sm:overflow-hidden flex flex-col justify-between">
              <RunningCinematicBackdrop
                imageSrc="/images/clinic_corridor.jpg"
                altText="Clinic Capacity Recovered Phase 4"
                opacity="opacity-40"
                accentGlow="emerald"
                showParticles={false}
                gradientOverlay="from-white/75 via-white/60 to-white/75"
              />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
                {/* Left Content */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-xs font-mono text-emerald-800 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>PHASE 04 · AUTONOMOUS RECOVERY</span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-black text-slate-950 uppercase tracking-tight leading-[1.05]">
                    ZERO DEAD TIME. <br />
                    <span className="text-emerald-700">CAPACITY RESTORED.</span>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    If the slot remains unconfirmed, SlotSure matches an urgent waitlist patient in seconds, converting a lost appointment into protected clinic revenue.
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500">
                    <span className="text-emerald-800 font-bold">Transition: Coral → Sage</span>
                    <span>·</span>
                    <span>Revenue Preserved: +₹3,500</span>
                  </div>

                  {onExploreFullDemo && (
                    <button
                      onClick={onExploreFullDemo}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all group cursor-pointer"
                    >
                      <span>TRY 2-MINUTE LIVE SIMULATOR</span>
                      <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  )}
                </div>

                {/* Right Card: Reallocation Convergence */}
                <div className="lg:col-span-6 flex justify-center">
                  <div className="w-full max-w-md p-5 sm:p-6 rounded-[24px] bg-white border border-slate-200 shadow-[0_16px_40px_-10px_rgba(16,185,129,0.18)] space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="text-xs font-mono uppercase text-slate-500 font-bold">
                        SLOT REALLOCATION EVENT
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
                        RECOVERED (SAGE)
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-rose-700 block font-bold">UNCONFIRMED SLOT</span>
                          <span className="text-xs font-bold text-slate-700 line-through">Aarav Mehta · 10:30 AM</span>
                        </div>
                        <span className="text-xs font-mono text-rose-700 font-bold">RELEASED</span>
                      </div>

                      <div className="flex justify-center text-slate-400">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>

                      <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-300 flex items-center justify-between shadow-sm">
                        <div>
                          <span className="text-[10px] font-mono text-emerald-700 block font-bold">WAITLIST MATCH</span>
                          <span className="text-sm font-extrabold text-slate-900">Priya Kapoor</span>
                          <span className="text-xs text-slate-500 block">Urgent Follow-up · Ready</span>
                        </div>
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                          ✓
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-600 font-medium">CLINICAL VALUE PRESERVED</span>
                      <span className="text-emerald-700 font-extrabold text-sm">+₹3,500.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trailing Buffer for clean scroll completion */}
            <div className="w-[10vw] flex-shrink-0" />
          </motion.div>
        </div>

        {/* 3. Bottom HUD Progress Indicator */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex-1 space-y-1.5">
            <div
              onClick={handleProgressBarClick}
              className="w-full h-2 bg-slate-100 hover:bg-slate-200 cursor-pointer rounded-full overflow-hidden transition-colors"
              title="Click to jump along the timeline"
            >
              <div
                style={{ width: `${Math.max(6, scrollProgress * 100)}%` }}
                className="h-full bg-gradient-to-r from-cyan-600 via-amber-500 to-emerald-600 rounded-full transition-all duration-75"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <span>PHASE {activePhase + 1} OF 4</span>
                <span>·</span>
                <span className="font-bold text-slate-800">{phases[activePhase].title.toUpperCase()}</span>
              </span>
              <span className="text-slate-400 hidden sm:inline">
                ↓ SCROLL DOWN TO PROGRESS THROUGH PHASES ↓
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
