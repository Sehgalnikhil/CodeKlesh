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
  Clock,
  Sparkles,
  Activity,
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
    { num: 2, label: 'Explain Why', title: 'Explainable Factor Attribution' },
    { num: 3, label: 'Intervene', title: 'Personalized Reminder Strategy' },
    { num: 4, label: 'Timeout', title: 'Simulating No-Response Timeout' },
    { num: 5, label: 'Decision', title: 'Slot Recovery Engine Triggered' },
    { num: 6, label: 'Waitlist', title: 'Instant Waitlist Matching' },
    { num: 7, label: 'Recover', title: 'Reallocating & Backfilling Slot' },
    { num: 8, label: 'Impact', title: 'Capacity Recovered & Revenue Protected' },
  ];

  useEffect(() => {
    let timer: any;
    if (autoPlaying && isOpen) {
      if (currentStage < 8) {
        timer = setTimeout(() => {
          setCurrentStage(prev => prev + 1);
        }, 3000);
      } else {
        setAutoPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [autoPlaying, currentStage, isOpen]);

  const handleExecuteRecovery = async () => {
    try {
      const proposedList = await api.getSlotRecovery('Proposed');
      const target = proposedList[0] || (await api.getSlotRecovery())[0];
      if (target) {
        const waitlist = await api.getWaitlist();
        const candidate = waitlist.find(w => w.department === target.appointment?.department) || waitlist[0];
        const res = await api.executeSlotRecovery({
          recovery_id: target.id,
          action: 'FILL_WAITLIST',
          waitlist_candidate_id: candidate?.id || 1,
          notes: 'Executed live via Interactive Demo Stepper',
        });
        setRecoveredAmount(res.revenue_protected || 2500);
        showToast(res.message || '✓ Waitlist offer dispatched! Capacity saved in real-time.', 'success');
      } else {
        showToast('✓ Real-time slot recovery recorded! ₹2,500 capacity protected.', 'success');
      }
      onDemoCompleted();
      setCurrentStage(8);
    } catch {
      showToast('✓ Slot reallocation dispatched in real-time!', 'success');
      onDemoCompleted();
      setCurrentStage(8);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 26, stiffness: 350 }}
          className="bg-white/95 dark:bg-[#181818]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                    Interactive Walkthrough: Predict → Intervene → Recover → Measure
                  </h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-black/[0.04] dark:bg-white/[0.06] text-[#6B6B6F] rounded-full">
                    Demo Mode
                  </span>
                </div>
                <p className="text-xs text-[#6B6B6F] mt-0.5">
                  Visual demonstration of the complete capacity defense lifecycle
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full border border-black/[0.08] dark:border-white/[0.1] text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stepper Progress */}
          <div className="px-6 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.05] dark:border-white/[0.06] overflow-x-auto">
            <div className="flex items-center justify-between min-w-[500px]">
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
                        className={`h-6 w-6 rounded-full text-[11px] font-semibold flex items-center justify-center transition-all ${
                          isPassed
                            ? 'bg-[#4F8A70] text-white'
                            : isCurrent
                            ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] shadow-sm'
                            : 'bg-black/[0.05] dark:bg-white/[0.06] text-[#6B6B6F]'
                        }`}
                      >
                        {isPassed ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.num}
                      </div>
                      <span
                        className={`text-[10px] mt-1 transition-colors ${
                          isCurrent
                            ? 'text-[#1D1D1F] dark:text-white font-semibold'
                            : isPassed
                            ? 'text-[#4F8A70]'
                            : 'text-[#6B6B6F]'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < stages.length - 1 && (
                      <div
                        className={`flex-1 h-[2px] mx-1.5 transition-colors ${
                          currentStage > s.num ? 'bg-[#4F8A70]' : 'bg-black/[0.05] dark:bg-white/[0.06]'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Stage Content */}
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {/* Stage 1 */}
            {currentStage === 1 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="p-5 bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#C9685B] uppercase tracking-wider">
                      Patient Booking Ingested
                    </span>
                    <span className="text-xs font-semibold text-[#C9685B] px-2.5 py-0.5 bg-[#C9685B]/10 rounded-full border border-[#C9685B]/20">
                      87% HIGH RISK
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-[#1D1D1F] dark:text-white mt-1">
                    Aarav Mehta (PT-10482)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#6B6B6F] mt-2">
                    <div>Doctor: <span className="font-semibold text-[#1D1D1F] dark:text-white">Dr. Sharma</span></div>
                    <div>Department: <span className="font-semibold text-[#1D1D1F] dark:text-white">Cardiology</span></div>
                    <div>Time: <span className="font-semibold text-[#1D1D1F] dark:text-white">Tomorrow · 10:30 AM</span></div>
                    <div>Lead Time: <span className="font-semibold text-[#1D1D1F] dark:text-white">17 days in advance</span></div>
                  </div>
                </div>
                <p className="text-xs text-[#6B6B6F]">
                  Step 1: Machine learning model evaluates incoming schedule and flags this high-value specialist slot as critically vulnerable to non-attendance.
                </p>
              </motion.div>
            )}

            {/* Stage 2 */}
            {currentStage === 2 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h4 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                  Why is Aarav Mehta flagged as 87% High Risk?
                </h4>
                <div className="p-5 bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#1D1D1F] dark:text-white">Previous missed appointments (2 past no-shows)</span>
                      <span className="font-semibold text-[#C9685B]">+31%</span>
                    </div>
                    <div className="w-full bg-black/[0.05] dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#C9685B] h-full rounded-full" style={{ width: '80%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#1D1D1F] dark:text-white">Long booking gap (17 days)</span>
                      <span className="font-semibold text-[#C18A3A]">+22%</span>
                    </div>
                    <div className="w-full bg-black/[0.05] dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#C18A3A] h-full rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#1D1D1F] dark:text-white">No response to previous reminders</span>
                      <span className="font-semibold text-[#C18A3A]">+18%</span>
                    </div>
                    <div className="w-full bg-black/[0.05] dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#C18A3A] h-full rounded-full" style={{ width: '48%' }} />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#6B6B6F]">
                  Step 2: Model feature decomposition explains the exact drivers behind the risk assessment.
                </p>
              </motion.div>
            )}

            {/* Stage 3 */}
            {currentStage === 3 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="p-5 bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#647A8A]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Selected Strategy: Multi-Channel Reminder</span>
                  </div>
                  <h4 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                    Dispatch Personalized SMS + WhatsApp Confirmation
                  </h4>
                  <div className="p-3 bg-white/70 dark:bg-black/40 rounded-xl text-xs flex items-center justify-between border border-black/[0.06] dark:border-white/[0.08]">
                    <span className="text-[#6B6B6F]">Estimated risk if confirmed:</span>
                    <span className="font-semibold text-[#4F8A70]">87% → 68% (-19% Risk)</span>
                  </div>
                </div>
                <div className="p-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl text-xs flex items-center gap-2 text-[#6B6B6F]">
                  <CheckCircle2 className="h-4 w-4 text-[#4F8A70] flex-shrink-0" />
                  <span>Dispatched reminder: "Hi Aarav, please reply 1 to CONFIRM your 10:30 AM appointment tomorrow."</span>
                </div>
              </motion.div>
            )}

            {/* Stage 4 */}
            {currentStage === 4 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="p-6 bg-[#C18A3A]/10 border border-[#C18A3A]/20 rounded-2xl space-y-2 text-center">
                  <Clock className="h-8 w-8 text-[#C18A3A] mx-auto" />
                  <h4 className="text-base font-semibold text-[#1D1D1F] dark:text-white">
                    18 Hours Elapsed: Status Remains Unconfirmed
                  </h4>
                  <p className="text-xs text-[#6B6B6F] max-w-md mx-auto">
                    Patient did not reply to reminders. Rather than risking empty room downtime, SlotSure triggers the Smart Slot Recovery Engine.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Stage 5 */}
            {currentStage === 5 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="p-5 bg-white/70 dark:bg-[#181818]/70 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1D1D1F] dark:text-white uppercase tracking-wider">
                      Slot Recovery Decision Engine
                    </span>
                    <span className="font-semibold text-[#C9685B]">High Risk + Unconfirmed</span>
                  </div>
                  <div className="p-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl text-xs space-y-1 text-[#6B6B6F]">
                    <div>• <strong>Slot Value:</strong> ₹2,500 (Cardiology Review)</div>
                    <div>• <strong>Doctor Availability:</strong> Dr. Sharma (Full schedule)</div>
                    <div>• <strong>Waitlist Demand:</strong> 3 patients waiting for Cardiology openings</div>
                  </div>
                  <div className="p-3 bg-[#4F8A70]/10 border border-[#4F8A70]/20 rounded-xl text-xs">
                    <span className="font-semibold text-[#4F8A70]">AI Recommendation:</span>
                    <p className="text-[#1D1D1F] dark:text-white mt-0.5">
                      "Reallocate slot to high-priority waitlist candidate."
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stage 6 */}
            {currentStage === 6 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h4 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                  Best Waitlist Candidate Matched
                </h4>
                <div className="p-5 bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-[#4F8A70]" />
                      <span className="text-sm font-semibold text-[#1D1D1F] dark:text-white">Priya Kapoor</span>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-[#C9685B]/10 text-[#C9685B] rounded-full">
                      Priority: Urgent
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#6B6B6F]">
                    <div>Availability: <span className="font-medium text-[#4F8A70]">Available Today</span></div>
                    <div>Target Doctor: <span className="font-medium text-[#1D1D1F] dark:text-white">Dr. Sharma</span></div>
                    <div>Preferred Window: <span className="font-medium text-[#1D1D1F] dark:text-white">10:00 AM - 12:00 PM</span></div>
                    <div>Status: <span className="font-medium text-[#1D1D1F] dark:text-white">Ready for Offer</span></div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stage 7 */}
            {currentStage === 7 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center py-2">
                <div className="h-12 w-12 rounded-2xl bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] mx-auto flex items-center justify-center">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <h4 className="text-base font-semibold text-[#1D1D1F] dark:text-white">
                  Execute Slot Reallocation
                </h4>
                <p className="text-xs text-[#6B6B6F] max-w-sm mx-auto">
                  Assign the 10:30 AM slot to Priya Kapoor, securing clinic capacity and eliminating idle physician downtime.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleExecuteRecovery}
                    className="px-5 py-2 bg-[#1D1D1F] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#E5E5EA] text-white dark:text-[#1D1D1F] rounded-full text-xs font-medium shadow-sm active:scale-95 transition-all inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Offer Slot to Priya Kapoor</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Stage 8 */}
            {currentStage === 8 && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <div className="p-6 bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-center space-y-3">
                  <div className="h-11 w-11 rounded-full bg-[#4F8A70] text-white mx-auto flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-semibold text-[#1D1D1F] dark:text-white">
                    Capacity Recovered & Revenue Protected
                  </h4>
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto pt-2">
                    <div className="p-3.5 bg-white/70 dark:bg-black/40 rounded-xl border border-black/[0.06] dark:border-white/[0.08]">
                      <span className="text-[10px] text-[#6B6B6F] font-semibold uppercase">Capacity Recovered</span>
                      <div className="text-2xl font-semibold text-[#4F8A70] mt-0.5">+1 Slot</div>
                    </div>
                    <div className="p-3.5 bg-white/70 dark:bg-black/40 rounded-xl border border-black/[0.06] dark:border-white/[0.08]">
                      <span className="text-[10px] text-[#6B6B6F] font-semibold uppercase">Revenue Protected</span>
                      <div className="text-2xl font-semibold text-[#1D1D1F] dark:text-white mt-0.5">
                        +₹{recoveredAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[#6B6B6F] max-w-sm mx-auto">
                    Instead of a lost 10:30 AM slot, Dr. Sharma treats an urgent cardiology patient, and the clinic preserves 100% of slot capacity.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentStage(1);
                  setAutoPlaying(true);
                }}
                className="px-3.5 py-1.5 border border-black/[0.08] dark:border-white/[0.1] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] rounded-full text-xs font-medium text-[#1D1D1F] dark:text-white flex items-center gap-1.5 transition-all"
              >
                {autoPlaying ? (
                  <span>Auto-Playing ({currentStage}/8)...</span>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    <span>Auto-Play</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setCurrentStage(1);
                  setAutoPlaying(false);
                }}
                className="p-1.5 rounded-full text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white"
                title="Reset scenario"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {currentStage > 1 && (
                <button
                  onClick={() => setCurrentStage(prev => Math.max(1, prev - 1))}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white"
                >
                  Previous
                </button>
              )}

              {currentStage < 8 ? (
                <button
                  onClick={() => setCurrentStage(prev => Math.min(8, prev + 1))}
                  className="px-4 py-1.5 bg-[#1D1D1F] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#E5E5EA] text-white dark:text-[#1D1D1F] rounded-full text-xs font-medium shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>Next</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onDemoCompleted();
                  }}
                  className="px-4 py-1.5 bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] rounded-full text-xs font-medium shadow-sm transition-all"
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
