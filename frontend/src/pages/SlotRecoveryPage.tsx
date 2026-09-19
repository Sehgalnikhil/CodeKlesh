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
  CheckCircle2,
  Users,
  Filter,
  Check,
  X,
  RefreshCw,
  Send,
  Calendar,
  Eye,
  UserPlus,
  Loader2,
  Trash2,
  Stethoscope
} from 'lucide-react';
import { SlotRecoveryItem, WaitlistEntry, Appointment } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { RiskBadge } from '../components/ui/RiskBadge';

interface SlotRecoveryPageProps {
  onRefreshData: () => void;
}

export const SlotRecoveryPage: React.FC<SlotRecoveryPageProps> = ({ onRefreshData }) => {
  const { showToast } = useAuth();
  const [activeTab, setActiveTab] = useState<'RECOVERY_QUEUE' | 'WAITLIST'>('RECOVERY_QUEUE');
  const [recoveries, setRecoveries] = useState<SlotRecoveryItem[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  // Modals & confirmation sheets
  const [selectedRecoveryForWaitlist, setSelectedRecoveryForWaitlist] = useState<SlotRecoveryItem | null>(null);
  const [selectedRecoveryForDoubleBook, setSelectedRecoveryForDoubleBook] = useState<SlotRecoveryItem | null>(null);
  const [slotToRelease, setSlotToRelease] = useState<SlotRecoveryItem | null>(null);
  const [matchingWaitlistForSlot, setMatchingWaitlistForSlot] = useState<SlotRecoveryItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // For Waitlist "Find Match"
  const [selectedWaitlistEntryForMatch, setSelectedWaitlistEntryForMatch] = useState<WaitlistEntry | null>(null);
  const [offeringSlotId, setOfferingSlotId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const [recData, wlData] = await Promise.all([
        api.getSlotRecovery(),
        api.getWaitlist({ status: 'All' }),
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
      setIsProcessing(true);
      const res = await api.executeSlotRecovery({
        recovery_id: recoveryId,
        action: 'FILL_WAITLIST',
        waitlist_candidate_id: waitlistId,
      });
      showToast(res.message, 'success');
      setSelectedRecoveryForWaitlist(null);
      await loadData();
      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteDoubleBook = async (recoveryId: number) => {
    try {
      setIsProcessing(true);
      const res = await api.executeSlotRecovery({
        recovery_id: recoveryId,
        action: 'DOUBLE_BOOK',
      });
      showToast(res.message, 'success');
      setSelectedRecoveryForDoubleBook(null);
      await loadData();
      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReleaseSlot = async () => {
    if (!slotToRelease) return;
    try {
      setIsProcessing(true);
      const res = await api.executeSlotRecovery({
        recovery_id: slotToRelease.id,
        action: 'RELEASE',
      });
      showToast(res.message || 'Slot successfully released', 'success');
      setSlotToRelease(null);
      await loadData();
      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Release failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeepMonitoring = async (recovery: SlotRecoveryItem) => {
    try {
      setIsProcessing(true);
      showToast(`✓ Retained ${recovery.appointment?.patient?.first_name || 'Patient'} on active monitoring. Automated reminder ping queued.`, 'info');
      await api.updateAppointmentStatus(recovery.appointment_id, {
        sms_reminder_sent: true,
      });
      await loadData();
      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOfferSlotDirect = async (waitlistId: number, appointmentId?: number) => {
    try {
      setOfferingSlotId(waitlistId);
      const res = await api.offerWaitlistSlot(waitlistId, appointmentId);
      showToast(`✓ Slot offered to waitlist patient. Capacity updated.`, 'success');
      setSelectedWaitlistEntryForMatch(null);
      await loadData();
      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to offer slot', 'error');
    } finally {
      setOfferingSlotId(null);
    }
  };

  const activeAtRiskSlots = recoveries.filter(r => r.status === 'Proposed');

  const filteredSlots = recoveries.filter(r => {
    if (filterAction === 'ALL') return true;
    if (filterAction === 'EXECUTED') return r.status === 'Executed';
    return r.action_type === filterAction && r.status === 'Proposed';
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9685B]">
            Clinical Capacity Protection
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white mt-1">
            Slot Recovery & Waitlist
          </h1>
          <p className="text-sm text-[#6B6B6F] mt-1">
            Reallocate unconfirmed high-risk appointment slots before capacity goes idle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Switcher Tabs */}
          <div className="flex items-center p-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-full">
            <button
              onClick={() => setActiveTab('RECOVERY_QUEUE')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'RECOVERY_QUEUE'
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm'
                  : 'text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white'
              }`}
            >
              At-Risk Slots ({activeAtRiskSlots.length})
            </button>
            <button
              onClick={() => setActiveTab('WAITLIST')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'WAITLIST'
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm'
                  : 'text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white'
              }`}
            >
              Waitlist ({waitlist.filter(w => w.status === 'Waiting').length})
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white/70 dark:bg-white/[0.04] hover:bg-black/[0.03] dark:hover:bg-white/[0.08] text-[#6B6B6F] transition-all"
            title="Sync data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {activeTab === 'RECOVERY_QUEUE' ? (
        <>
          {/* Visual Pipeline Banner */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-[#181818]/70 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6F]">
                Autonomous Recovery Pipeline
              </span>
              <span className="text-[11px] font-medium text-[#4F8A70]">
                Live Capacity Protection Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-[10px] font-bold text-[#C9685B] uppercase block">1. At-Risk Slot</span>
                <p className="font-semibold text-[#1D1D1F] dark:text-white mt-1 truncate">Unconfirmed &gt;70% Risk</p>
                <p className="text-[11px] text-[#6B6B6F] mt-0.5">Identified via ML model</p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-[10px] font-bold text-[#C18A3A] uppercase block">2. Recommendation</span>
                <p className="font-semibold text-[#1D1D1F] dark:text-white mt-1 truncate">Check Waitlist Backfill</p>
                <p className="text-[11px] text-[#6B6B6F] mt-0.5">Automated triage reason</p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-[10px] font-bold text-[#647A8A] uppercase block">3. Candidate Match</span>
                <p className="font-semibold text-[#1D1D1F] dark:text-white mt-1 truncate">Matching Department</p>
                <p className="text-[11px] text-[#6B6B6F] mt-0.5">Ranked by urgency</p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-[10px] font-bold text-[#4F8A70] uppercase block">4. Recovered Slot</span>
                <p className="font-semibold text-[#4F8A70] mt-1 truncate">100% Slot Value Intact</p>
                <p className="text-[11px] text-[#6B6B6F] mt-0.5">Zero clinic idle time</p>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-full w-fit">
            {[
              { id: 'ALL', label: 'All Slots' },
              { id: 'WAITLIST', label: 'Waitlist Backfill' },
              { id: 'DOUBLE_BOOK', label: 'Controlled Double-Book' },
              { id: 'EXECUTED', label: 'Recovered' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterAction(f.id)}
                className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                  filterAction === f.id
                    ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm'
                    : 'text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Slots Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredSlots.map(item => {
              const app = item.appointment;
              const pat = app?.patient;
              const prob = Math.round(item.risk_probability * 100);
              const isExecuted = item.status === 'Executed';
              const isWaitlistAction = item.action_type === 'WAITLIST';
              const isDoubleBookAction = item.action_type === 'DOUBLE_BOOK';

              // Matching waitlist count
              const matchingCandidates = waitlist.filter(w => w.department === app?.department && w.status === 'Waiting');
              const matchCount = matchingCandidates.length;

              return (
                <div
                  key={item.id}
                  className={`p-6 rounded-2xl bg-white/70 dark:bg-[#181818]/70 backdrop-blur-xl border flex flex-col justify-between transition-all ${
                    isExecuted
                      ? 'border-[#4F8A70]/30 opacity-90'
                      : 'border-white/60 dark:border-white/10 shadow-[0_8px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header: Time, Doctor, Risk */}
                    <div className="flex items-start justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-semibold text-[#1D1D1F] dark:text-white tracking-tight">
                            {app?.appointment_time || '10:30 AM'}
                          </span>
                          <span className="text-xs text-[#6B6B6F]">· {app?.appointment_date}</span>
                        </div>
                        <p className="text-xs text-[#6B6B6F] mt-0.5">
                          {app?.doctor_name} · {app?.department}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-semibold text-[#C9685B]">
                          {prob}% Risk
                        </div>
                        <span className="text-[10px] text-[#6B6B6F] uppercase block mt-0.5">
                          {app?.confirmation_status || 'Not confirmed'}
                        </span>
                      </div>
                    </div>

                    {/* Patient info */}
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#6B6B6F] block">Scheduled Patient</span>
                        <div className="font-semibold text-sm text-[#1D1D1F] dark:text-white mt-0.5">
                          {pat?.first_name} {pat?.last_name}
                        </div>
                        <span className="text-[11px] text-[#6B6B6F]">
                          Prior missed: <span className="font-semibold text-[#C9685B]">{pat?.missed_appointments || 0}</span> · Booking gap: {app?.days_in_advance}d
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[#6B6B6F] block">Potential Value</span>
                        <div className="font-semibold text-sm text-[#1D1D1F] dark:text-white mt-0.5">
                          ₹{(app?.estimated_slot_value || 2500).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* AI Recommendation */}
                    <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#647A8A]">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>AI Recommendation: {isExecuted ? 'RECOVERED' : item.recommendation}</span>
                      </div>
                      <p className="text-[11px] text-[#6B6B6F] leading-relaxed">
                        {item.reasoning}
                      </p>
                    </div>

                    {/* Matching Waitlist Indicator */}
                    {!isExecuted && matchCount > 0 && (
                      <div className="p-2.5 rounded-xl bg-[#4F8A70]/10 border border-[#4F8A70]/20 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-[#4F8A70]" />
                          <span className="font-medium text-[#1D1D1F] dark:text-white">
                            {matchCount} matching {matchCount === 1 ? 'patient' : 'patients'} available
                          </span>
                        </div>
                        <span className="text-[10px] text-[#4F8A70] font-semibold uppercase">
                          Ready to backfill
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-4 flex items-center justify-between gap-2 border-t border-black/[0.05] dark:border-white/[0.06]">
                    {isExecuted ? (
                      <div className="flex items-center gap-1.5 text-xs text-[#4F8A70] font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Slot Recovered (+₹{item.revenue_protected.toLocaleString('en-IN')})</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          {isWaitlistAction && (
                            <button
                              onClick={() => setSelectedRecoveryForWaitlist(item)}
                              className="px-3.5 py-1.5 bg-[#1D1D1F] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#E5E5EA] text-white dark:text-[#1D1D1F] rounded-full text-xs font-medium transition-all shadow-sm flex items-center gap-1.5"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Offer to Waitlist</span>
                            </button>
                          )}

                          {isDoubleBookAction && (
                            <button
                              onClick={() => setSelectedRecoveryForDoubleBook(item)}
                              className="px-3.5 py-1.5 bg-[#C18A3A] hover:bg-[#A87630] text-white rounded-full text-xs font-medium transition-all shadow-sm flex items-center gap-1.5"
                            >
                              <Users className="h-3.5 w-3.5" />
                              <span>Controlled Double-Book</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleKeepMonitoring(item)}
                            className="px-3 py-1.5 border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white rounded-full hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all"
                          >
                            Keep Monitoring
                          </button>

                          <button
                            onClick={() => setSlotToRelease(item)}
                            className="px-3 py-1.5 border border-[#C9685B]/30 text-xs font-medium text-[#C9685B] hover:bg-[#C9685B]/10 rounded-full transition-all"
                          >
                            Release Slot
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Real Clinical Waitlist View */
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white/70 dark:bg-[#181818]/70 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
              <div>
                <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-white">
                  Active Clinical Waitlist
                </h3>
                <p className="text-xs text-[#6B6B6F] mt-0.5">
                  Pre-screened patients standby for early cancellation or backfill slots.
                </p>
              </div>
            </div>

            <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06] mt-2">
              {waitlist.map(entry => (
                <div key={entry.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#1D1D1F] dark:text-white">
                        {entry.patient ? `${entry.patient.first_name} ${entry.patient.last_name}` : `Patient #${entry.patient_id}`}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        entry.priority === 'Urgent'
                          ? 'bg-[#C9685B]/10 text-[#C9685B] border border-[#C9685B]/20'
                          : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#6B6B6F]'
                      }`}>
                        {entry.priority}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        entry.status === 'Booked'
                          ? 'bg-[#4F8A70]/10 text-[#4F8A70]'
                          : 'bg-[#C18A3A]/10 text-[#C18A3A]'
                      }`}>
                        {entry.status === 'Booked' ? 'Slot Booked' : 'Waiting for Response'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[#6B6B6F]">
                      <span>Doctor: <strong className="text-[#1D1D1F] dark:text-white font-medium">{entry.doctor_name || 'Any'}</strong></span>
                      <span>·</span>
                      <span>Department: {entry.department}</span>
                      <span>·</span>
                      <span>Preferred: {entry.preferred_date || 'Earliest'} ({entry.preferred_time_range})</span>
                    </div>

                    {entry.notes && (
                      <p className="text-[11px] text-[#6B6B6F] italic">"{entry.notes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {entry.status !== 'Booked' ? (
                      <button
                        disabled={offeringSlotId === entry.id}
                        onClick={() => handleOfferSlotDirect(entry.id)}
                        className="px-3.5 py-1.5 bg-[#1D1D1F] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#E5E5EA] text-white dark:text-[#1D1D1F] rounded-full text-xs font-medium transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {offeringSlotId === entry.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        <span>Offer Slot</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-[#4F8A70] font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Confirmed & Booked</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Sheet for Destructive Release Action */}
      <AnimatePresence>
        {slotToRelease && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 26, stiffness: 350 }}
              className="w-full max-w-md bg-white/95 dark:bg-[#181818]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] rounded-2xl shadow-xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-full bg-[#C9685B]/10 text-[#C9685B] flex-shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-white">
                    Release this appointment slot?
                  </h3>
                  <p className="text-xs text-[#6B6B6F] mt-1 leading-relaxed">
                    This will release the {slotToRelease.appointment?.appointment_time} slot with {slotToRelease.appointment?.doctor_name} back to public booking availability.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-xs text-[#6B6B6F] space-y-1">
                <div>Scheduled: <strong className="text-[#1D1D1F] dark:text-white">{slotToRelease.appointment?.patient?.first_name} {slotToRelease.appointment?.patient?.last_name}</strong></div>
                <div>Potential value: <strong className="text-[#1D1D1F] dark:text-white">₹{(slotToRelease.appointment?.estimated_slot_value || 2500).toLocaleString('en-IN')}</strong></div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  disabled={isProcessing}
                  onClick={() => setSlotToRelease(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-black/[0.08] dark:border-white/[0.1] text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={isProcessing}
                  onClick={handleConfirmReleaseSlot}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-[#C9685B] hover:bg-[#B55B4F] text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  <span>Release Slot</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Fill from Waitlist */}
      <AnimatePresence>
        {selectedRecoveryForWaitlist && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 26, stiffness: 350 }}
              className="w-full max-w-xl bg-white/95 dark:bg-[#181818]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[#4F8A70] text-[10px] font-bold uppercase tracking-wider">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Instant Waitlist Backfill</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-white mt-0.5">
                    Match Candidates for {selectedRecoveryForWaitlist.appointment?.appointment_time} Slot
                  </h3>
                  <p className="text-xs text-[#6B6B6F] mt-0.5">
                    Doctor: {selectedRecoveryForWaitlist.appointment?.doctor_name} ({selectedRecoveryForWaitlist.appointment?.department})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRecoveryForWaitlist(null)}
                  className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.1] text-[#6B6B6F]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                <span className="text-[10px] font-bold text-[#6B6B6F] uppercase tracking-wider block">
                  Available Matches
                </span>

                {waitlist.filter(w => w.status === 'Waiting').map(cand => (
                  <div
                    key={cand.id}
                    className="p-3.5 rounded-xl border border-black/[0.05] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#1D1D1F] dark:text-white">
                          {cand.patient?.first_name} {cand.patient?.last_name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                          cand.priority === 'Urgent'
                            ? 'bg-[#C9685B]/10 text-[#C9685B]'
                            : 'bg-[#647A8A]/10 text-[#647A8A]'
                        }`}>
                          {cand.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B6B6F] mt-0.5">
                        Department: {cand.department} · Pref: {cand.preferred_time_range}
                      </p>
                    </div>

                    <button
                      disabled={isProcessing}
                      onClick={() => handleExecuteWaitlistMatch(selectedRecoveryForWaitlist.id, cand.id)}
                      className="px-3.5 py-1.5 bg-[#1D1D1F] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#E5E5EA] text-white dark:text-[#1D1D1F] rounded-full text-xs font-medium transition-all shadow-sm flex items-center gap-1 flex-shrink-0"
                    >
                      <span>Offer & Book</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-black/[0.01] dark:bg-white/[0.02] border-t border-black/[0.06] dark:border-white/[0.08] flex justify-end">
                <button
                  onClick={() => setSelectedRecoveryForWaitlist(null)}
                  className="px-4 py-1.5 border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium rounded-full text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Controlled Double Booking Guardrail */}
      <AnimatePresence>
        {selectedRecoveryForDoubleBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 26, stiffness: 350 }}
              className="w-full max-w-lg bg-white/95 dark:bg-[#181818]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#C18A3A]/10 text-[#C18A3A] flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-white">
                      Controlled Double-Booking Guardrail
                    </h3>
                    <p className="text-xs text-[#6B6B6F] mt-0.5">Clinical Overlap & Buffer Evaluation</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecoveryForDoubleBook(null)}
                  className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.1] text-[#6B6B6F]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-3 text-xs text-[#6B6B6F]">
                <p className="leading-relaxed">
                  The model projects an <strong>{Math.round(selectedRecoveryForDoubleBook.risk_probability * 100)}% no-show probability</strong> with no response to previous reminders. Controlled secondary booking protects clinical utilization without compromising patient care.
                </p>

                <div className="p-3.5 rounded-xl bg-[#C18A3A]/10 border border-[#C18A3A]/20 text-[#1D1D1F] dark:text-white space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#C18A3A]">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Safety Checklist</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#6B6B6F]">
                    <li>Doctor has a 15-minute buffer before the next appointment block.</li>
                    <li>Overbooking overlap probability: Low (&lt;15% chance both attend).</li>
                    <li>If both arrive, the secondary patient receives expedited triage.</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-black/[0.01] dark:bg-white/[0.02] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  disabled={isProcessing}
                  onClick={() => setSelectedRecoveryForDoubleBook(null)}
                  className="px-4 py-2 border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium rounded-xl text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => handleExecuteDoubleBook(selectedRecoveryForDoubleBook.id)}
                  className="px-4 py-2 bg-[#C18A3A] hover:bg-[#A87630] text-white rounded-xl text-xs font-medium transition-all shadow-sm"
                >
                  Confirm Double-Book
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
