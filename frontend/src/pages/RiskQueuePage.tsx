import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Search,
  Send,
  UserCheck,
  ChevronRight,
  ChevronDown,
  Sparkles,
  PhoneCall,
  Clock,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Appointment } from '../types';

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
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Filter and sort by highest risk
  const riskAppointments = appointments
    .filter((app) => {
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
    })
    .sort((a, b) => (b.prediction?.risk_probability || 0) - (a.prediction?.risk_probability || 0));

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-coral-500">
            Priority Attention Queue
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-graphite-900 mt-1">
            Risk Queue
          </h1>
          <p className="text-xs md:text-sm text-charcoal-700 mt-1">
            Prioritized vertical stream. Expand each item for explainable factors and targeted intervention.
          </p>
        </div>

        <button
          onClick={onNavigateToRecovery}
          className="px-5 py-2.5 bg-graphite-900 hover:bg-charcoal-800 text-porcelain-100 rounded-full text-xs font-semibold shadow-spatial-soft active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Open Slot Recovery</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-stone-100/90 border border-stone-200/90 rounded-2xl shadow-spatial-soft flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-steel-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search at-risk patient, doctor, or code..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-porcelain-100 border border-stone-200 rounded-full text-graphite-900 placeholder:text-steel-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center p-1 bg-stone-200/70 rounded-full">
          {(['ALL', 'UNCONFIRMED', 'CONFIRMED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setConfirmationFilter(tab)}
              className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all ${
                confirmationFilter === tab
                  ? 'bg-graphite-900 text-porcelain-100 shadow-spatial-soft'
                  : 'text-charcoal-700 hover:text-graphite-900'
              }`}
            >
              {tab === 'UNCONFIRMED' ? 'Unconfirmed (Actionable)' : tab === 'CONFIRMED' ? 'Confirmed' : 'All Risk'}
            </button>
          ))}
        </div>
      </div>

      {/* PRIORITIZED VERTICAL STREAM (No generic table) */}
      <div className="space-y-4">
        {riskAppointments.map((app) => {
          const prob = Math.round((app.prediction?.risk_probability || 0.5) * 100);
          const isHigh = app.prediction?.risk_level === 'HIGH';
          const isExpanded = expandedId === app.id;
          const isConfirmed = app.confirmation_status === 'Confirmed';

          return (
            <motion.div
              key={app.id}
              layout
              className={`rounded-2xl border transition-all overflow-hidden ${
                isHigh
                  ? 'bg-porcelain-50 border-coral-500/40 shadow-spatial-soft hover:border-coral-500'
                  : 'bg-stone-50 border-amber-500/40 shadow-spatial-soft hover:border-amber-500'
              }`}
            >
              {/* Main Collapsed Stream Row */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : app.id)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
              >
                {/* Left: Risk Percentage + Patient info */}
                <div className="flex items-center gap-5">
                  <div className="text-center min-w-[60px]">
                    <span
                      className={`text-3xl font-black font-mono tracking-tight block leading-none ${
                        isHigh ? 'text-coral-500' : 'text-amber-500'
                      }`}
                    >
                      {prob}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-steel-500 tracking-wider">
                      {app.prediction?.risk_level || 'HIGH'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-graphite-900 tracking-tight">
                        {app.patient?.first_name} {app.patient?.last_name}
                      </h3>
                      <span className="text-[10px] font-mono text-steel-500 bg-stone-200/60 px-1.5 py-0.5 rounded">
                        {app.patient?.patient_code || `PT-${app.patient_id}`}
                      </span>
                    </div>

                    <p className="text-xs text-charcoal-700 mt-1">
                      {app.appointment_date} · {app.appointment_time} · {app.doctor_name} ({app.department})
                    </p>
                  </div>
                </div>

                {/* Right: Confirmation Status & Quick Action */}
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isConfirmed
                          ? 'bg-sage-100 text-eucalyptus-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isConfirmed ? 'bg-eucalyptus-500' : 'bg-amber-500'
                        }`}
                      />
                      {app.confirmation_status || 'Not confirmed'}
                    </span>

                    <span className="text-[11px] text-steel-500 block mt-1">
                      Value: ₹{(app.estimated_slot_value || 2500).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSendReminder(app);
                      }}
                      className="px-4 py-1.5 rounded-full bg-graphite-900 hover:bg-charcoal-800 text-porcelain-100 text-xs font-semibold shadow-spatial-soft flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Send className="w-3 h-3" />
                      <span>Intervene</span>
                    </button>

                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-steel-500 hover:text-graphite-900">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Smooth Expanded Spatial Analysis View */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-stone-200/80 bg-stone-100/50 p-5 space-y-4 text-xs"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Why this risk */}
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-steel-500 block mb-2">
                          Explainable Risk Factors
                        </span>
                        <div className="space-y-2">
                          {(app.prediction?.top_factors?.length
                            ? app.prediction.top_factors
                            : [
                                { label: 'Previous missed appointments', percentage: 31 },
                                { label: 'Booking gap lead-time', percentage: 22 },
                                { label: 'Unconfirmed outreach history', percentage: 18 },
                              ]
                          ).map((f: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-charcoal-700">
                              <span>{f.label || f.factor}</span>
                              <span className="font-bold text-coral-500 font-mono">
                                +{Math.abs(f.percentage || 20)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Recommended action */}
                      <div className="p-4 rounded-xl bg-porcelain-50 border border-stone-200 space-y-2">
                        <div className="flex items-center gap-1.5 text-eucalyptus-600 font-bold uppercase tracking-wider text-[10px]">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Recommended Action</span>
                        </div>
                        <p className="text-graphite-900 font-semibold text-xs">
                          {app.prediction?.recommended_action || 'Send Personalized Clinical Reminder'}
                        </p>
                        <p className="text-steel-500 text-[11px] leading-relaxed">
                          Patient is at high risk of non-attendance. Proactive multi-channel reminder offers estimated {Math.round((prob * 0.4))}% risk reduction.
                        </p>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 flex items-center justify-between border-t border-stone-200/80">
                      <button
                        onClick={() => onSelectAppointment(app)}
                        className="text-xs font-semibold text-graphite-900 hover:underline flex items-center gap-1"
                      >
                        <span>Open Full Patient Sheet</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenSendReminder(app)}
                          className="px-3 py-1.5 rounded-full border border-stone-300 hover:bg-stone-200 text-graphite-900 text-xs font-semibold"
                        >
                          Schedule Outreach
                        </button>
                        <button
                          onClick={onNavigateToRecovery}
                          className="px-3 py-1.5 rounded-full bg-graphite-900 text-porcelain-100 hover:bg-charcoal-800 text-xs font-semibold"
                        >
                          Queue Slot Recovery
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {riskAppointments.length === 0 && (
          <div className="text-center py-16 p-8 rounded-2xl bg-stone-100 border border-stone-200 text-steel-500 text-xs">
            No at-risk appointments matching the selected filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
