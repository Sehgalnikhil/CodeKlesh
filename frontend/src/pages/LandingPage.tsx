import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldAlert,
  Clock,
  Send,
  BarChart3,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Activity,
  Zap,
  Users,
  UserCheck,
  IndianRupee,
  Layers,
  Award
} from 'lucide-react';
import { RiskBadge } from '../components/ui/RiskBadge';

interface LandingPageProps {
  onOpenDashboard: () => void;
  onOpenDemoModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenDashboard,
  onOpenDemoModal,
}) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] selection:bg-brand-500 selection:text-white antialiased transition-colors">
      {/* Top Navbar - Apple Glassmorphism */}
      <nav className="border-b border-black/[0.06] dark:border-white/[0.08] bg-white/75 dark:bg-black/75 backdrop-blur-2xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onOpenDashboard}>
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_2px_10px_rgba(79,70,229,0.35)]">
              <Zap className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-[#1d1d1f] dark:text-white">
                SlotSure
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-md border border-brand-500/20">
                PRO
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <button onClick={() => scrollToSection('workflow')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Workflow
            </button>
            <button onClick={() => scrollToSection('recovery')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Recovery Engine
            </button>
            <button onClick={() => scrollToSection('impact')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Impact & ROI
            </button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Pricing
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenDemoModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:opacity-80 transition-opacity"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              <span>Live Demo (2m)</span>
            </button>
            <button
              onClick={onOpenDashboard}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-full shadow-[0_2px_12px_rgba(79,70,229,0.35)] active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Launch App</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-28 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[360px] bg-brand-500/15 blur-[140px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white/80 dark:bg-white/[0.05] backdrop-blur-xl text-zinc-700 dark:text-zinc-300 text-xs font-bold mb-8 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            <span>AI Missed Appointment Predictor & Smart Slot Recovery</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-7xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white max-w-4xl mx-auto leading-[1.08]"
          >
            PREDICT THE NO-SHOW. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600">
              RECOVER THE SLOT.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-base sm:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Enterprise clinical decision intelligence that predicts appointment no-shows, personalizes patient reminders, and automatically backfills at-risk capacity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <button
              onClick={onOpenDashboard}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-full text-sm font-bold shadow-[0_4px_16px_rgba(79,70,229,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onOpenDemoModal}
              className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-white/[0.08] hover:bg-black/[0.04] dark:hover:bg-white/[0.12] border border-black/[0.08] dark:border-white/[0.1] text-zinc-800 dark:text-white rounded-full text-sm font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="h-4 w-4 text-brand-500" />
              <span>Interactive Demo (2 min)</span>
            </button>
          </motion.div>

          {/* 5-Step Lifecycle Graphic */}
          <motion.div
            id="workflow"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 max-w-4xl mx-auto p-6 md:p-8 bg-white/80 dark:bg-[#141416]/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.06)] text-left"
          >
            <div className="flex items-center justify-between pb-5 border-b border-black/[0.05] dark:border-white/[0.06]">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                End-to-End Capacity Recovery Flow
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 rounded-full">
                Zero Empty Slots
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-6">
              <div className="p-4 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 block tracking-wider">01. PREDICT</span>
                <div className="font-extrabold text-[#1d1d1f] dark:text-white mt-1 text-sm">87% Risk</div>
                <p className="text-[11px] text-zinc-400 mt-1">Aarav Mehta, Cardiology tomorrow</p>
              </div>

              <div className="p-4 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 block tracking-wider">02. EXPLAIN</span>
                <div className="font-extrabold text-[#1d1d1f] dark:text-white mt-1 text-sm">XAI Attribution</div>
                <p className="text-[11px] text-zinc-400 mt-1">2 prior misses (+31%), long gap (+22%)</p>
              </div>

              <div className="p-4 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 block tracking-wider">03. INTERVENE</span>
                <div className="font-extrabold text-[#1d1d1f] dark:text-white mt-1 text-sm">Multi-Channel</div>
                <p className="text-[11px] text-zinc-400 mt-1">WhatsApp prompt with 1-tap confirm</p>
              </div>

              <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block tracking-wider">04. RECOVER</span>
                <div className="font-extrabold text-rose-700 dark:text-rose-300 mt-1 text-sm">Waitlist Match</div>
                <p className="text-[11px] text-rose-600/90 dark:text-rose-400/90 mt-1">Priya Kapoor backfilled into slot</p>
              </div>

              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block tracking-wider">05. MEASURE</span>
                <div className="font-extrabold text-emerald-700 dark:text-emerald-300 mt-1 text-sm">+₹2,500 Saved</div>
                <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 mt-1">100% capacity preserved</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Business Impact Section */}
      <section id="impact" className="py-20 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Business Impact</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white mt-2">
              Measurable Capacity & Revenue Defense
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-medium">Operational benchmark across pilot healthcare cohorts.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
            <div className="p-6 bg-white/80 dark:bg-[#141416]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] rounded-3xl shadow-sm text-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Appointments Ingested</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1d1d1f] dark:text-white mt-2">1,284</div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">Outpatient Visits</span>
            </div>

            <div className="p-6 bg-white/80 dark:bg-[#141416]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] rounded-3xl shadow-sm text-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">High-Risk Identified</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">183</div>
              <span className="text-[11px] text-rose-500 font-bold mt-1 block">&gt;65% Probability</span>
            </div>

            <div className="p-6 bg-white/80 dark:bg-[#141416]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] rounded-3xl shadow-sm text-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Slots Refilled</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-brand-600 dark:text-brand-400 mt-2">48</div>
              <span className="text-[11px] text-brand-500 font-bold mt-1 block">Waitlist Backfilled</span>
            </div>

            <div className="p-6 bg-white/80 dark:bg-[#141416]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] rounded-3xl shadow-sm text-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Revenue Protected</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">₹1.42L</div>
              <span className="text-[11px] text-emerald-500 font-bold mt-1 block">Recovered Revenue</span>
            </div>
          </div>
        </div>
      </section>

      {/* SaaS Pricing Section */}
      <section id="pricing" className="py-24 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">SaaS Pricing</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white mt-2">
              Flexible Plans for Every Clinic
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              Transparent, capacity-based tiers for private clinics, diagnostic labs, and hospitals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            {/* Starter */}
            <div className="p-7 bg-white/80 dark:bg-[#141416]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] rounded-3xl shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-base font-extrabold text-[#1d1d1f] dark:text-white">Starter</h4>
                <p className="text-xs text-zinc-400 mt-1">For single-practitioner private clinics</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[#1d1d1f] dark:text-white">₹2,999</span>
                  <span className="text-xs text-zinc-400 font-medium">/mo</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Up to 350 appointments/mo</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> ML risk prediction model</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Automated SMS reminders</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Basic waitlist queue</li>
                </ul>
              </div>
              <button
                onClick={onOpenDashboard}
                className="mt-8 w-full py-2.5 bg-black/[0.04] hover:bg-black/[0.07] dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-[#1d1d1f] dark:text-white text-xs font-bold rounded-full transition-all active:scale-95"
              >
                Get Started
              </button>
            </div>

            {/* Professional (Highlighted) */}
            <div className="p-7 bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-2xl border-2 border-brand-500 rounded-3xl shadow-[0_8px_30px_rgba(99,102,241,0.25)] flex flex-col justify-between relative">
              <span className="absolute -top-3.5 right-6 px-3 py-1 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                Most Popular
              </span>
              <div>
                <h4 className="text-base font-extrabold text-[#1d1d1f] dark:text-white">Professional</h4>
                <p className="text-xs text-zinc-400 mt-1">For multi-specialty centers & nursing homes</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">₹7,999</span>
                  <span className="text-xs text-zinc-400 font-medium">/mo</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Up to 2,000 appointments/mo</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Smart Slot Recovery Center</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Automated Waitlist Matching</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Controlled Double-Booking engine</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Revenue defense analytics</li>
                </ul>
              </div>
              <button
                onClick={onOpenDashboard}
                className="mt-8 w-full py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold rounded-full shadow-sm active:scale-95 transition-all"
              >
                Start 14-Day Trial
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-7 bg-white/80 dark:bg-[#141416]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] rounded-3xl shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-base font-extrabold text-[#1d1d1f] dark:text-white">Enterprise</h4>
                <p className="text-xs text-zinc-400 mt-1">For hospital networks & multi-city groups</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[#1d1d1f] dark:text-white">Custom</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Unlimited appointments</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Direct EHR/EMR bidirectional sync</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Custom trained clinical ensemble</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Dedicated account manager</li>
                </ul>
              </div>
              <button
                onClick={onOpenDashboard}
                className="mt-8 w-full py-2.5 bg-black/[0.04] hover:bg-black/[0.07] dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-[#1d1d1f] dark:text-white text-xs font-bold rounded-full transition-all active:scale-95"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-black/[0.06] dark:border-white/[0.08] text-center text-xs text-zinc-400">
        <p>© 2026 SlotSure AI Inc. Designed for Apple-grade clinical decision excellence.</p>
      </footer>
    </div>
  );
};
