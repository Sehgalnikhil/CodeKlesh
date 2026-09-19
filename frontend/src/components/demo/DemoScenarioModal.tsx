import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Send,
  UserCheck,
  IndianRupee,
  Clock,
  Sparkles,
  Zap,
  RotateCcw,
  ShieldCheck,
  CalendarCheck
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface DemoScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDemoCompleted: () => void;
}

export const DemoScenarioModal: React.FC<DemoScenarioModalProps> = ({
  isOpen,
  onClose,
  onDemoCompleted,
}) => {
  const { showToast } = useAuth();
  const [currentStage, setCurrentStage] = useState(1);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [recoveredAmount, setRecoveredAmount] = useState(2500);

  const stages = [
    { num: 1, label: 'Predict Risk', title: 'High-Risk Appointment Detected' },
    { num: 2, label: 'Explain Why', title: 'Explainable AI Factor Attribution' },
    { num: 3, label: 'Intervene', title: 'Personalized Reminder Strategy' },
    { num: 4, label: 'Timeout', title: 'Simulating No-Response Timeout' },
    { num: 5, label: 'Smart Decision', title: 'Slot Recovery Engine Triggered' },
    { num: 6, label: 'Waitlist Match', title: 'Instant Waitlist Matching' },
    { num: 7, label: 'Recover Slot', title: 'Reallocating & Backfilling Slot' },
    { num: 8, label: 'Impact & ROI', title: 'Capacity Recovered & Revenue Protected' },
  ];

  // Auto-play timer
  useEffect(() => {
    let timer: any;
    if (autoPlaying && isOpen) {
      if (currentStage < 8) {
        timer = setTimeout(() => {
          setCurrentStage(prev => prev + 1);
        }, 3200);
      } else {
        setAutoPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [autoPlaying, currentStage, isOpen]);

  const handleExecuteRecovery = async () => {
    try {
      showToast('✓ Waitlist offer dispatched to Priya Kapoor! Slot reallocated.');
      setCurrentStage(8);
    } catch (err: any) {
      showToast('Simulated action executed', 'info');
      setCurrentStage(8);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="bg-white/95 dark:bg-[#161618]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] rounded-[28px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.5)] max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#1d1d1f] dark:text-white">
                    2-Minute Demo: Predict → Act → Recover → Measure
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full border border-brand-500/20">
                    Live Stepper
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Experience the full capacity protection lifecycle in under 2 minutes
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.05] dark:hover:bg-white/[0.1] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center justify-center transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="px-6 py-3 bg-black/[0.02] dark:bg-white/[0.03] border-b border-black/[0.05] dark:border-white/[0.06] overflow-x-auto">
            <div className="flex items-center justify-between min-w-[540px]">
              {stages.map((s, idx) => {
                const isPassed = currentStage > s.num;
                const isCurrent = currentStage === s.num;
                return (
                  <React.Fragment key={s.num}>
                    <div
                      onClick={() => setCurrentStage(s.num)}
                      className="flex flex-col items-center cursor-pointer group transition-all"
                    >
                      <div
                        className={`h-6 w-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-all ${
                          isPassed
                            ? 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                            : isCurrent
                            ? 'bg-gradient-to-tr from-brand-600 to-indigo-600 text-white ring-4 ring-brand-500/20 shadow-sm'
                            : 'bg-black/[0.06] dark:bg-white/[0.08] text-zinc-400'
                        }`}
                      >
                        {isPassed ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.num}
                      </div>
                      <span
                        className={`text-[10px] mt-1 font-semibold transition-colors ${
                          isCurrent
                            ? 'text-brand-600 dark:text-brand-400 font-bold'
                            : isPassed
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < stages.length - 1 && (
                      <div
                        className={`flex-1 h-[2px] mx-1.5 transition-colors ${
                          currentStage > s.num ? 'bg-emerald-500' : 'bg-black/[0.06] dark:bg-white/[0.08]'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Interactive Stage Content */}
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {/* Stage 1: Select High-Risk Appointment */}
            {currentStage === 1 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      Patient Booking Ingested
                    </span>
                    <span className="text-xs font-bold text-rose-600 px-2.5 py-0.5 bg-rose-500/15 rounded-full border border-rose-500/20">
                      87% HIGH RISK
                    </span>
                  </div>
                  <h4 className="text-lg font-extrabold text-[#1d1d1f] dark:text-white mt-1">
                    Aarav Mehta (PT-10482)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-300 mt-2">
                    <div>Doctor: <span className="font-bold text-[#1d1d1f] dark:text-zinc-100">Dr. Sharma</span></div>
                    <div>Department: <span className="font-bold text-[#1d1d1f] dark:text-zinc-100">Cardiology</span></div>
                    <div>Time: <span className="font-bold text-[#1d1d1f] dark:text-zinc-100">Tomorrow · 10:30 AM</span></div>
                    <div>Lead Time: <span className="font-bold text-[#1d1d1f] dark:text-zinc-100">17 days in advance</span></div>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-medium">
                  Step 1: Machine learning model scans incoming clinic schedule in real time and flags this high-value specialist slot as critically vulnerable to non-attendance.
                </p>
              </motion.div>
            )}

            {/* Stage 2: Explain Risk Drivers */}
            {currentStage === 2 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h4 className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                  Why is Aarav Mehta flagged as 87% High Risk?
                </h4>
                <div className="p-5 bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] rounded-2xl space-y-3.5 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Previous missed appointments (2 past no-shows)</span>
                      <span className="font-bold text-rose-600">+31%</span>
                    </div>
                    <div className="w-full bg-black/[0.06] dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: '80%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Long booking-to-appointment gap (17 days)</span>
                      <span className="font-bold text-amber-600">+22%</span>
                    </div>
                    <div className="w-full bg-black/[0.06] dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-zinc-700 dark:text-zinc-300 font-semibold">No response to previous automated reminders</span>
                      <span className="font-bold text-amber-600">+18%</span>
                    </div>
                    <div className="w-full bg-black/[0.06] dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '48%' }} />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-medium">
                  Step 2: Explainable AI ensures clinical staff understand exactly why the patient is at risk, replacing black-box guesses with transparent evidence.
                </p>
              </motion.div>
            )}

            {/* Stage 3: Personalized Reminder Strategy */}
            {currentStage === 3 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="p-5 bg-brand-500/10 border border-brand-500/20 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Selected Strategy: Multi-Channel Escalation</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                    Send Personalized 2-Way SMS + WhatsApp Confirmation Prompt
                  </h4>
                  <div className="p-3.5 bg-white/80 dark:bg-zinc-900/80 rounded-xl text-xs flex items-center justify-between border border-brand-500/20 shadow-sm">
                    <span className="text-zinc-500">Estimated risk if confirmed:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">87% → 68% (-19% Risk Reduction)</span>
                  </div>
                </div>
                <div className="p-3.5 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl text-xs flex items-center gap-2.5 text-zinc-600 dark:text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>Dispatching simulated WhatsApp prompt: "Hi Aarav, please reply 1 to CONFIRM your 10:30 AM visit tomorrow."</span>
                </div>
              </motion.div>
            )}

            {/* Stage 4: Simulate No-Response Timeout */}
            {currentStage === 4 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2 text-center">
                  <Clock className="h-9 w-9 text-amber-500 mx-auto" />
                  <h4 className="text-base font-extrabold text-amber-900 dark:text-amber-200">
                    18 Hours Elapsed: Status Remains "Not Confirmed"
                  </h4>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300/90 max-w-md mx-auto font-medium">
                    Patient did not reply to SMS or WhatsApp confirmation. With only 16 hours remaining until the appointment, traditional clinics would simply suffer an empty room.
                  </p>
                </div>
                <p className="text-xs text-zinc-400 font-medium">
                  Step 4: Instead of waiting for a no-show tomorrow, SlotSure triggers the <strong>Smart Slot Recovery Engine</strong>.
                </p>
              </motion.div>
            )}

            {/* Stage 5: Slot Recovery Engine Triggered */}
            {currentStage === 5 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="p-5 bg-white/80 dark:bg-zinc-900/80 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1d1d1f] dark:text-white uppercase tracking-wider">
                      Slot Recovery Decision Engine
                    </span>
                    <span className="font-bold text-rose-600">High Risk + Unconfirmed</span>
                  </div>
                  <div className="p-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl text-xs space-y-1">
                    <div>• <strong>Slot Value:</strong> ₹2,500 (Cardiology Review)</div>
                    <div>• <strong>Doctor Availability:</strong> Dr. Sharma (Full day schedule)</div>
                    <div>• <strong>Waitlist Demand:</strong> 3 patients actively waiting for Cardiology openings</div>
                  </div>
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">AI Recommendation:</span>
                    <p className="text-emerald-700 dark:text-emerald-300 mt-0.5 font-medium">
                      "Release slot and notify high-priority waitlist candidate."
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stage 6: Waitlist Match */}
            {currentStage === 6 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h4 className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                  Best Waitlist Candidate Matched
                </h4>
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-extrabold text-[#1d1d1f] dark:text-white">Priya Kapoor</span>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-500/30">
                      Priority: Urgent
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <div>Availability: <span className="font-bold text-emerald-600 dark:text-emerald-400">Available Today</span></div>
                    <div>Target Doctor: <span className="font-bold text-[#1d1d1f] dark:text-zinc-100">Dr. Sharma</span></div>
                    <div>Preferred Window: <span className="font-bold text-[#1d1d1f] dark:text-zinc-100">10:00 AM - 12:00 PM</span></div>
                    <div>Contact Status: <span className="font-bold text-[#1d1d1f] dark:text-zinc-100">Ready for Slot Offer</span></div>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-medium">
                  Step 6: SlotSure's matching engine pairs the at-risk slot with a waiting patient whose doctor preference and time window align with 100% precision.
                </p>
              </motion.div>
            )}

            {/* Stage 7: Recover Slot Action */}
            {currentStage === 7 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center py-2">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-md">
                  <CalendarCheck className="h-7 w-7" />
                </div>
                <h4 className="text-lg font-extrabold text-[#1d1d1f] dark:text-white">
                  Execute Slot Reallocation
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto font-medium">
                  Offer and assign the 10:30 AM slot to Priya Kapoor, securing clinic capacity and eliminating dead physician downtime.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleExecuteRecovery}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-full text-xs font-bold shadow-[0_2px_12px_rgba(16,185,129,0.35)] active:scale-95 transition-all inline-flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Offer Slot to Priya Kapoor</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Stage 8: Measure Business Impact */}
            {currentStage === 8 && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 rounded-3xl text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.5)]">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-xl font-extrabold text-[#1d1d1f] dark:text-white tracking-tight">
                    Capacity Recovered & Revenue Protected!
                  </h4>
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto pt-2">
                    <div className="p-3.5 bg-white/80 dark:bg-zinc-900/80 rounded-2xl border border-emerald-500/20 shadow-sm">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Capacity Recovered</span>
                      <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">+1 Slot</div>
                    </div>
                    <div className="p-3.5 bg-white/80 dark:bg-zinc-900/80 rounded-2xl border border-emerald-500/20 shadow-sm">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Revenue Protected</span>
                      <div className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">+₹2,500</div>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto font-medium">
                    Instead of a lost 10:30 AM slot, Dr. Sharma treats an urgent cardiology patient, and the clinic recovers 100% of slot revenue.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentStage(1);
                  setAutoPlaying(true);
                }}
                className="px-4 py-1.5 border border-black/[0.08] dark:border-white/[0.1] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-full text-xs font-bold text-[#1d1d1f] dark:text-zinc-200 flex items-center gap-1.5 transition-all active:scale-95"
              >
                {autoPlaying ? (
                  <span>Auto-Playing ({currentStage}/8)...</span>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    <span>Auto-Play (2m)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setCurrentStage(1);
                  setAutoPlaying(false);
                }}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                title="Reset scenario"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {currentStage > 1 && (
                <button
                  onClick={() => setCurrentStage(prev => Math.max(1, prev - 1))}
                  className="px-4 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  Previous
                </button>
              )}

              {currentStage < 8 ? (
                <button
                  onClick={() => setCurrentStage(prev => Math.min(8, prev + 1))}
                  className="px-5 py-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>Next: {stages[currentStage]?.label}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onDemoCompleted();
                  }}
                  className="px-5 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all"
                >
                  Return to Dashboard
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
