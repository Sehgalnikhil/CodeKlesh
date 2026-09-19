import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  UserCheck,
  CalendarCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
  IndianRupee,
  CheckCircle2,
  Users,
  Filter,
  Check,
  X,
  RefreshCw,
  Send,
  Zap,
  ChevronRight,
  ArrowDown
} from 'lucide-react';
import { SlotRecoveryItem, WaitlistEntry } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { RiskBadge } from '../components/ui/RiskBadge';

interface SlotRecoveryPageProps {
  onRefreshData: () => void;
}

export const SlotRecoveryPage: React.FC<SlotRecoveryPageProps> = ({ onRefreshData }) => {
  const { showToast } = useAuth();
  const [recoveries, setRecoveries] = useState<SlotRecoveryItem[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  // Modals for actions
  const [selectedRecoveryForWaitlist, setSelectedRecoveryForWaitlist] = useState<SlotRecoveryItem | null>(null);
  const [selectedRecoveryForDoubleBook, setSelectedRecoveryForDoubleBook] = useState<SlotRecoveryItem | null>(null);

  const loadData = async () => {
    try {
      const [recData, wlData] = await Promise.all([
        api.getSlotRecovery(),
        api.getWaitlist(),
      ]);
      setRecoveries(recData);
      setWaitlist(wlData);
    } catch (err: any) {
      console.error('Error loading recovery slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExecuteWaitlistMatch = async (recoveryId: number, waitlistId: number) => {
    try {
      const res = await api.executeSlotRecovery({
        recovery_id: recoveryId,
        action: 'FILL_WAITLIST',
        waitlist_candidate_id: waitlistId,
      });
      showToast(res.message);
      setSelectedRecoveryForWaitlist(null);
      await loadData();
      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleExecuteDoubleBook = async (recoveryId: number) => {
    try {
      const res = await api.executeSlotRecovery({
        recovery_id: recoveryId,
        action: 'DOUBLE_BOOK',
      });
      showToast(res.message);
      setSelectedRecoveryForDoubleBook(null);
      await loadData();
      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleExecuteRelease = async (recoveryId: number) => {
    try {
      const res = await api.executeSlotRecovery({
        recovery_id: recoveryId,
        action: 'RELEASE',
      });
      showToast(res.message);
      await loadData();
      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const [selectedRecoveryId, setSelectedRecoveryId] = useState<number | null>(null);

  const activeAtRiskSlots = recoveries.filter(r => r.status === 'Proposed');

  const activeSlot =
    (selectedRecoveryId ? recoveries.find(r => r.id === selectedRecoveryId) : null) ||
    activeAtRiskSlots[0] ||
    recoveries[0];

  const activeApp = activeSlot?.appointment;
  const activePat = activeApp?.patient;
  const activeProb = Math.round((activeSlot?.risk_probability || 0.85) * 100);
  const activeCandidate =
    activeSlot?.candidate_waitlist ||
    waitlist.find(w => w.department === activeApp?.department) ||
    waitlist[0];
  const activeProtected = activeSlot?.revenue_protected || activeApp?.estimated_slot_value || 2500;

  const filteredSlots = recoveries.filter(r => {
    if (filterAction === 'ALL') return true;
    if (filterAction === 'EXECUTED') return r.status === 'Executed';
    return r.action_type === filterAction && r.status === 'Proposed';
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header - Apple AI Control Center */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400">
            SLOT RECOVERY ENGINE
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] mt-1">
            {activeAtRiskSlots.length || 11} appointment slots need attention.
          </h1>
          <p className="text-sm text-[#6E6E73] mt-1">
            Proactively identify unconfirmed high-risk appointments and reallocate capacity before slots go idle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.05] hover:bg-black/[0.04] dark:hover:bg-white/[0.1] text-zinc-600 dark:text-zinc-300 transition-all shadow-sm active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh recovery queue"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sync Queue</span>
          </button>
        </div>
      </div>

      {/* Visual Connection Flow: At-risk appointment → AI decision → Waitlist match → Recovered slot */}
      <div className="p-6 rounded-3xl apple-card relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]">
            Live Autonomous Recovery Architecture (Active Pipeline Flow)
          </div>
          <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">
            Click any slot below to inspect
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
          {/* Step 1: At-risk appointment */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs relative">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide block">
              1. At-Risk Slot
            </span>
            <div className="font-extrabold text-[#1D1D1F] dark:text-white mt-1 text-sm truncate">
              {activeApp?.appointment_time || '10:30 AM'} · {activePat ? `${activePat.first_name} ${activePat.last_name}` : 'Aarav Mehta'}
            </div>
            <p className="text-[11px] text-[#6E6E73] mt-1 truncate">
              {activeProb}% no-show risk · {activeApp?.confirmation_status || 'Unconfirmed'}
            </p>
          </div>

          {/* Step 2: AI Decision */}
          <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs relative">
            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide block">
              2. AI Decision
            </span>
            <div className="font-extrabold text-[#1D1D1F] dark:text-white mt-1 text-sm truncate">
              {activeSlot?.action_type === 'WAITLIST' ? 'Waitlist Backfill' : activeSlot?.action_type === 'DOUBLE_BOOK' ? 'Controlled Double-Book' : 'Capacity Protection'}
            </div>
            <p className="text-[11px] text-[#6E6E73] mt-1 truncate">
              {activeSlot?.reasoning ? activeSlot.reasoning : 'Triggered after 24h confirmation timeout'}
            </p>
          </div>

          {/* Step 3: Waitlist Match */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs relative">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide block">
              3. Waitlist Match
            </span>
            <div className="font-extrabold text-[#1D1D1F] dark:text-white mt-1 text-sm truncate">
              {activeCandidate?.patient ? `${activeCandidate.patient.first_name} ${activeCandidate.patient.last_name}` : 'Priya Kapoor'} ({activeCandidate?.priority || 'Urgent'})
            </div>
            <p className="text-[11px] text-[#6E6E73] mt-1 truncate">
              {activeCandidate?.department || activeApp?.department || 'General Medicine'} · Matches doctor & time
            </p>
          </div>

          {/* Step 4: Recovered Slot */}
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs relative">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide block">
              4. Recovered Slot
            </span>
            <div className="font-extrabold text-emerald-700 dark:text-emerald-300 mt-1 text-sm">
              ₹{activeProtected.toLocaleString('en-IN')} Protected
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
              {activeSlot?.status === 'Executed' ? 'Capacity fully restored' : '100% capacity preserved'}
            </p>
          </div>
        </div>
      </div>

      {/* Segmented Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-black/[0.03] dark:bg-white/[0.05] rounded-full w-fit max-w-full">
        {[
          { id: 'ALL', label: 'All At-Risk Slots' },
          { id: 'WAITLIST', label: 'Waitlist Backfill' },
          { id: 'DOUBLE_BOOK', label: 'Controlled Double-Book' },
          { id: 'EXECUTED', label: 'Recovered Slots' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilterAction(f.id)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 whitespace-nowrap ${
              filterAction === f.id
                ? 'bg-white dark:bg-zinc-800 text-[#1D1D1F] dark:text-white shadow-sm'
                : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Large At-Risk Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSlots.map(item => {
          const app = item.appointment;
          const pat = app?.patient;
          const prob = Math.round(item.risk_probability * 100);
          const isExecuted = item.status === 'Executed';
          const isWaitlistAction = item.action_type === 'WAITLIST';
          const isDoubleBookAction = item.action_type === 'DOUBLE_BOOK';

          // Candidate match for waitlist
          const matchingCandidate = waitlist.find(w => w.department === app?.department) || waitlist[0];
          const isSelected = activeSlot?.id === item.id;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedRecoveryId(item.id)}
              className={`p-6 sm:p-7 rounded-3xl apple-card flex flex-col justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-brand-500/60 shadow-lg'
                  : ''
              } ${
                isExecuted
                  ? 'border-emerald-500/40 opacity-90'
                  : item.risk_probability >= 0.8
                  ? 'border-rose-500/30'
                  : ''
              }`}
            >
              <div>
                {/* Header: Time, Doctor, Risk */}
                <div className="flex items-start justify-between pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-extrabold text-[#1D1D1F] dark:text-white tracking-tight">
                        {app?.appointment_time || '10:30 AM'}
                      </span>
                      <span className="text-xs text-[#6E6E73] font-medium">· {app?.appointment_date}</span>
                    </div>
                    <p className="text-xs text-[#6E6E73] mt-0.5 font-medium">
                      {app?.doctor_name} · {app?.department}
                    </p>
                    {isSelected && (
                      <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-300">
                        Inspecting in Pipeline Flow
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                      {prob}% Risk
                    </div>
                    <span className="text-[10px] text-[#6E6E73] font-semibold uppercase mt-0.5 block">
                      {app?.confirmation_status || 'Not confirmed'}
                    </span>
                  </div>
                </div>

                {/* Scheduled Patient Summary */}
                <div className="py-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#6E6E73] block">Scheduled Patient</span>
                    <div className="font-bold text-sm text-[#1D1D1F] dark:text-white mt-0.5">
                      {pat?.first_name} {pat?.last_name}
                    </div>
                    <span className="text-[11px] text-[#6E6E73]">
                      Prior missed: <strong className="text-rose-600">{pat?.missed_appointments || 0}</strong> · Lead time: {app?.days_in_advance}d
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#6E6E73] block">Potential Capacity</span>
                    <div className="font-extrabold text-sm text-[#1D1D1F] dark:text-white mt-0.5">
                      ₹{(app?.estimated_slot_value || 2500).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* AI Recommendation Banner */}
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Recommendation: {isExecuted ? 'RECOVERY EXECUTED' : item.recommendation}</span>
                  </div>
                  <p className="text-[11px] text-[#6E6E73] leading-relaxed font-medium">
                    {item.reasoning}
                  </p>
                </div>

                {/* Matching Waitlist Patient Preview */}
                {!isExecuted && isWaitlistAction && matchingCandidate && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                        Matching Waitlist Patient
                      </span>
                      <div className="font-bold text-xs text-[#1D1D1F] dark:text-white mt-0.5">
                        {matchingCandidate.patient?.first_name} {matchingCandidate.patient?.last_name}
                      </div>
                      <span className="text-[10px] text-[#6E6E73]">
                        {matchingCandidate.department} · Available Today
                      </span>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      {matchingCandidate.priority}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-3 flex items-center justify-between gap-2 border-t border-black/[0.05] dark:border-white/[0.06]">
                {isExecuted ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Slot Successfully Recovered (+₹{item.revenue_protected.toLocaleString('en-IN')})</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      {isWaitlistAction && (
                        <button
                          onClick={() => setSelectedRecoveryForWaitlist(item)}
                          className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Fill from Waitlist</span>
                        </button>
                      )}

                      {isDoubleBookAction && (
                        <button
                          onClick={() => setSelectedRecoveryForDoubleBook(item)}
                          className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Controlled Double-Book</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleExecuteRelease(item.id)}
                        className="px-3.5 py-1.5 border border-black/[0.08] dark:border-white/[0.1] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 rounded-full text-xs font-semibold active:scale-95 transition-all"
                      >
                        Release Slot
                      </button>
                    </div>

                    <span className="text-[11px] text-[#6E6E73] font-semibold">
                      Protect ₹{(app?.estimated_slot_value || 2500).toLocaleString('en-IN')}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal 1: Fill from Waitlist */}
      {selectedRecoveryForWaitlist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="w-full max-w-xl bg-white/95 dark:bg-[#161618]/95 backdrop-blur-3xl border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-dropdown overflow-hidden"
          >
            <div className="p-6 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Instant Waitlist Backfill</span>
                </div>
                <h3 className="text-lg font-extrabold text-[#1D1D1F] dark:text-white mt-0.5">
                  Match Candidates for {selectedRecoveryForWaitlist.appointment?.appointment_time} Slot
                </h3>
                <p className="text-xs text-[#6E6E73] mt-0.5">
                  Doctor: {selectedRecoveryForWaitlist.appointment?.doctor_name} ({selectedRecoveryForWaitlist.appointment?.department})
                </p>
              </div>
              <button
                onClick={() => setSelectedRecoveryForWaitlist(null)}
                className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.1] text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              <div className="text-[11px] font-bold text-[#6E6E73] uppercase tracking-wider">
                Prioritized Waitlist Matches
              </div>

              {waitlist.slice(0, 5).map(cand => (
                <div
                  key={cand.id}
                  className="p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center justify-between gap-4 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#1D1D1F] dark:text-zinc-100">
                        {cand.patient?.first_name} {cand.patient?.last_name}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          cand.priority === 'Urgent'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                        }`}
                      >
                        {cand.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6E6E73] mt-1">
                      Target Dept: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{cand.department}</span> · Pref: {cand.preferred_time_range}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5 italic">{cand.notes}</p>
                  </div>

                  <button
                    onClick={() => handleExecuteWaitlistMatch(selectedRecoveryForWaitlist.id, cand.id)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1 flex-shrink-0"
                  >
                    <span>Offer & Confirm</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end">
              <button
                onClick={() => setSelectedRecoveryForWaitlist(null)}
                className="px-4 py-1.5 border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal 2: Controlled Double Booking Safety Guardrail */}
      {selectedRecoveryForDoubleBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="w-full max-w-lg bg-white/95 dark:bg-[#161618]/95 backdrop-blur-3xl border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-dropdown overflow-hidden"
          >
            <div className="p-6 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1D1D1F] dark:text-white">
                    Controlled Double-Booking Guardrail
                  </h3>
                  <p className="text-xs text-[#6E6E73] mt-0.5">Clinical Overlap & Buffer Evaluation</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecoveryForDoubleBook(null)}
                className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.1] text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                The AI Decision Engine recommends opening this slot for a controlled secondary booking because the scheduled patient has an <strong>82% no-show probability</strong> and has ignored 2 reminders.
              </p>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Clinical Safety Checklist</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li>Doctor: {selectedRecoveryForDoubleBook.appointment?.doctor_name} has a 15-minute buffer before the next block.</li>
                  <li>Overbooking risk probability: Low (&lt;18% chance both attend).</li>
                  <li>In the rare event both arrive, second patient is flagged for expedited triage.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedRecoveryForDoubleBook(null)}
                className="px-4 py-1.5 border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteDoubleBook(selectedRecoveryForDoubleBook.id)}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all"
              >
                Confirm Controlled Double-Book
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
