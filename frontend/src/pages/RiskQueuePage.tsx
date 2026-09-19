import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Send,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { Appointment } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { useAuth } from '../context/AuthContext';

interface RiskQueuePageProps {
  appointments: Appointment[];
  onSelectAppointment: (app: Appointment) => void;
  onOpenSendReminder: (app: Appointment) => void;
  onNavigateToRecovery: () => void;
}

export const RiskQueuePage: React.FC<RiskQueuePageProps> = ({
  appointments,
  onSelectAppointment,
  onOpenSendReminder,
  onNavigateToRecovery,
}) => {
  const [confirmationFilter, setConfirmationFilter] = useState<'ALL' | 'UNCONFIRMED' | 'CONFIRMED'>('UNCONFIRMED');
  const [search, setSearch] = useState('');

  // Filter to High and Medium risk
  const riskAppointments = appointments.filter(app => {
    const risk = app.prediction?.risk_level || 'LOW';
    if (risk === 'LOW') return false;

    if (confirmationFilter === 'UNCONFIRMED' && app.confirmation_status === 'Confirmed') return false;
    if (confirmationFilter === 'CONFIRMED' && app.confirmation_status !== 'Confirmed') return false;

    if (search) {
      const q = search.toLowerCase();
      const name = `${app.patient?.first_name} ${app.patient?.last_name}`.toLowerCase();
      const doc = app.doctor_name.toLowerCase();
      if (!name.includes(q) && !doc.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => (b.prediction?.risk_probability || 0) - (a.prediction?.risk_probability || 0));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-[11px] font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span>Priority Attention Queue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
            Today's Risk Queue
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            High and medium non-attendance probability appointments requiring proactive intervention.
          </p>
        </div>

        <button
          onClick={onNavigateToRecovery}
          className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-full text-xs font-bold shadow-[0_2px_12px_rgba(79,70,229,0.35)] active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <UserCheck className="h-4 w-4" />
          <span>Open Slot Recovery Center</span>
        </button>
      </div>

      {/* Filter Header with Search & Segmented Control */}
      <div className="p-3 bg-white/80 dark:bg-[#141416]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search at-risk patients, doctors..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.06] rounded-full text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>

        <div className="flex items-center p-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-full">
          {(['ALL', 'UNCONFIRMED', 'CONFIRMED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setConfirmationFilter(tab)}
              className={`px-3.5 py-1 text-[11px] font-bold rounded-full transition-all duration-200 ${
                confirmationFilter === tab
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {tab === 'UNCONFIRMED' ? 'Unconfirmed (Actionable)' : tab === 'CONFIRMED' ? 'Confirmed' : 'All Risk'}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Queue Table Card */}
      <div className="rounded-3xl bg-white/80 dark:bg-[#141416]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/[0.04] dark:border-white/[0.06] text-zinc-400 font-semibold text-[11px]">
                <th className="py-3.5 px-5">Patient & Code</th>
                <th className="py-3.5 px-4">Time & Date</th>
                <th className="py-3.5 px-4">Doctor</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">No-Show Risk</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Est. Value</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
              {riskAppointments.map(app => {
                const prob = Math.round((app.prediction?.risk_probability || 0.5) * 100);
                const risk = app.prediction?.risk_level || 'HIGH';
                const isConfirmed = app.confirmation_status === 'Confirmed';
                const isHigh = risk === 'HIGH';

                return (
                  <tr
                    key={app.id}
                    onClick={() => onSelectAppointment(app)}
                    className="group hover:bg-black/[0.02] dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-[#1d1d1f] dark:text-[#f5f5f7] group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {app.patient?.first_name} {app.patient?.last_name}
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {app.patient?.patient_code}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                      <div>{app.appointment_time}</div>
                      <div className="text-[10px] text-zinc-400 font-normal">{app.appointment_date}</div>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                      {app.doctor_name}
                    </td>

                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                      {app.department}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-extrabold ${isHigh ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {prob}%
                        </span>
                        <RiskBadge level={risk} size="sm" />
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                          isConfirmed
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isConfirmed ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]' : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]'}`} />
                        {app.confirmation_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#1d1d1f] dark:text-zinc-200">
                      ₹{(app.estimated_slot_value || 2500).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onOpenSendReminder(app);
                          }}
                          className="px-3.5 py-1 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-full text-[11px] font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1"
                        >
                          <Send className="h-3 w-3" />
                          <span>Intervene</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
          <span>{riskAppointments.length} at-risk appointments queued</span>
          <button
            onClick={onNavigateToRecovery}
            className="text-brand-600 dark:text-brand-400 font-bold hover:underline inline-flex items-center gap-1"
          >
            <span>Proceed to Capacity Recovery</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
