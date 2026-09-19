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
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C18A3A]">
            Priority Attention Queue
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white mt-1">
            Risk Queue
          </h1>
          <p className="text-sm text-[#6B6B6F] mt-1">
            High and medium non-attendance probability appointments requiring proactive intervention.
          </p>
        </div>

        <button
          onClick={onNavigateToRecovery}
          className="px-4 py-2 bg-[#1D1D1F] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#E5E5EA] text-white dark:text-[#1D1D1F] rounded-full text-xs font-medium shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
        >
          <UserCheck className="h-3.5 w-3.5" />
          <span>Open Slot Recovery</span>
        </button>
      </div>

      {/* Filter Header with Search & Segmented Control */}
      <div className="p-2.5 bg-white/70 dark:bg-[#181818]/70 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-3.5 w-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6F]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search at-risk patients, doctors..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] rounded-full text-[#1D1D1F] dark:text-white placeholder:text-[#6B6B6F] focus:outline-none"
          />
        </div>

        <div className="flex items-center p-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-full">
          {(['ALL', 'UNCONFIRMED', 'CONFIRMED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setConfirmationFilter(tab)}
              className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all ${
                confirmationFilter === tab
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm'
                  : 'text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white'
              }`}
            >
              {tab === 'UNCONFIRMED' ? 'Unconfirmed (Actionable)' : tab === 'CONFIRMED' ? 'Confirmed' : 'All Risk'}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Queue Table Card */}
      <div className="rounded-2xl bg-white/70 dark:bg-[#181818]/70 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/[0.04] dark:border-white/[0.06] text-[#6B6B6F] font-semibold text-[11px]">
                <th className="py-3 px-5">Patient</th>
                <th className="py-3 px-4">Time & Date</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">No-Show Risk</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Potential Value</th>
                <th className="py-3 px-5 text-right">Action</th>
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
                    className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#1D1D1F] dark:text-white">
                        {app.patient?.first_name} {app.patient?.last_name}
                      </div>
                      <span className="text-[10px] text-[#6B6B6F] font-mono">
                        {app.patient?.patient_code}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#1D1D1F] dark:text-white font-medium">
                      <div>{app.appointment_time}</div>
                      <div className="text-[10px] text-[#6B6B6F] font-normal">{app.appointment_date}</div>
                    </td>

                    <td className="py-3.5 px-4 text-[#6B6B6F]">
                      {app.doctor_name}
                    </td>

                    <td className="py-3.5 px-4 text-[#6B6B6F]">
                      {app.department}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isHigh ? 'text-[#C9685B]' : 'text-[#C18A3A]'}`}>
                          {prob}%
                        </span>
                        <RiskBadge level={risk} size="sm" />
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                          isConfirmed
                            ? 'bg-[#4F8A70]/10 text-[#4F8A70] border-[#4F8A70]/20'
                            : 'bg-[#C18A3A]/10 text-[#C18A3A] border-[#C18A3A]/20'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isConfirmed ? 'bg-[#4F8A70]' : 'bg-[#C18A3A]'}`} />
                        {app.confirmation_status || 'Pending'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-[#1D1D1F] dark:text-white">
                      ₹{(app.estimated_slot_value || 2500).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onOpenSendReminder(app);
                          }}
                          className="px-3 py-1 bg-[#1D1D1F] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#E5E5EA] text-white dark:text-[#1D1D1F] rounded-full text-xs font-medium shadow-sm active:scale-95 transition-all flex items-center gap-1"
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

        <div className="p-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs text-[#6B6B6F]">
          <span>{riskAppointments.length} at-risk appointments queued</span>
          <button
            onClick={onNavigateToRecovery}
            className="text-[#1D1D1F] dark:text-white font-medium hover:underline inline-flex items-center gap-1"
          >
            <span>Proceed to Slot Recovery</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
