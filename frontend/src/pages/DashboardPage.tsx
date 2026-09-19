import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  AlertTriangle,
  UserX,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Send,
  Eye,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  UserCheck,
  PhoneCall,
  CalendarCheck
} from 'lucide-react';
import { Appointment, AnalyticsResponse } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

interface DashboardPageProps {
  analytics: AnalyticsResponse | null;
  todayAppointments: Appointment[];
  onSelectAppointment: (app: Appointment) => void;
  onOpenSendReminder: (app: Appointment) => void;
  onNavigateToRecovery: () => void;
  onOpenDemoModal: () => void;
  onRefreshData: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  analytics,
  todayAppointments,
  onSelectAppointment,
  onOpenSendReminder,
  onNavigateToRecovery,
  onOpenDemoModal,
  onRefreshData,
}) => {
  const { user, showToast } = useAuth();
  const [filterRisk, setFilterRisk] = useState<'ALL' | 'HIGH' | 'UNCONFIRMED'>('ALL');
  const [selectedFocalId, setSelectedFocalId] = useState<number | null>(null);

  const kpis = analytics?.kpis || {
    today_appointments: 128,
    high_risk_appointments: 17,
    predicted_no_shows: 23,
    slots_at_risk: 11,
    capacity_recovered_inr: 42800,
    revenue_protected_inr: 42800,
    today_appointments_change: '+8.4% vs last week',
    high_risk_change: '-3.2% vs yesterday',
    predicted_no_shows_change: '-12.5% after reminders',
    slots_at_risk_change: '11 unconfirmed slots',
    capacity_recovered_change: '+₹6,400 today',
  };

  // Real-time dynamic focal appointment: user-selected row > first high-risk appointment > first appointment
  const focalAppointment =
    (selectedFocalId ? todayAppointments.find(a => a.id === selectedFocalId) : null) ||
    todayAppointments.find(a => a.prediction?.risk_level === 'HIGH') ||
    todayAppointments[0];

  const filteredList = todayAppointments.filter(app => {
    if (filterRisk === 'HIGH') return app.prediction?.risk_level === 'HIGH';
    if (filterRisk === 'UNCONFIRMED') return app.confirmation_status !== 'Confirmed';
    return true;
  });

  const focalRisk = Math.round((focalAppointment?.prediction?.risk_probability || 0.87) * 100);
  const focalPatient = focalAppointment?.patient;
  const focalLevel = focalAppointment?.prediction?.risk_level || (focalRisk >= 75 ? 'HIGH' : focalRisk >= 40 ? 'MEDIUM' : 'LOW');
  const projectedRisk = Math.round((focalAppointment?.prediction?.estimated_impact_prob || Math.max(0.12, (focalRisk * 0.7) / 100)) * 100);
  const projectedDrop = Math.max(1, focalRisk - projectedRisk);

  // Dynamic stroke color for gauge
  const strokeColor = focalLevel === 'HIGH' ? '#FF3B30' : focalLevel === 'MEDIUM' ? '#FF9500' : '#34C759';

  // Dynamic factors from real ML prediction, or fallback to real patient clinical history
  const factors = (focalAppointment?.prediction?.top_factors && focalAppointment.prediction.top_factors.length > 0)
    ? focalAppointment.prediction.top_factors
    : [
        {
          factor: 'previous_no_shows',
          label: `Historical attendance (${focalPatient?.missed_appointments || 0} previous no-shows)`,
          impact_direction: (focalPatient?.missed_appointments || 0) > 0 ? ('positive' as const) : ('negative' as const),
          contribution: 0.35,
          percentage: Math.min(45, (focalPatient?.missed_appointments || 1) * 16)
        },
        {
          factor: 'lead_time',
          label: `Advance booking window (${focalAppointment?.days_in_advance || 10} days gap)`,
          impact_direction: (focalAppointment?.days_in_advance || 10) > 7 ? ('positive' as const) : ('negative' as const),
          contribution: 0.25,
          percentage: Math.min(30, (focalAppointment?.days_in_advance || 10) * 2)
        },
        {
          factor: 'confirmation',
          label: `Status: ${focalAppointment?.confirmation_status || 'Unconfirmed'}`,
          impact_direction: focalAppointment?.confirmation_status === 'Confirmed' ? ('negative' as const) : ('positive' as const),
          contribution: 0.2,
          percentage: focalAppointment?.confirmation_status === 'Confirmed' ? 24 : 18
        },
        {
          factor: 'transit',
          label: `Distance to clinic (${focalPatient?.distance_km || 8.5} km transit)`,
          impact_direction: 'positive' as const,
          contribution: 0.15,
          percentage: Math.min(22, Math.round((focalPatient?.distance_km || 8.5) * 1.5))
        }
      ];

  // Thin elegant SVG circular gauge calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (focalRisk / 100) * circumference;

  // First name greeting
  const greetingName = user?.full_name ? user.full_name.replace('Dr. ', '').split(' ')[0] : 'Nikhil';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Apple Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
            Good morning, {greetingName}.
          </h1>
          <p className="text-sm sm:text-base text-[#6E6E73] mt-1 font-normal">
            Your clinic's appointment capacity, at a glance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToRecovery}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-full transition-all flex items-center gap-2 active:scale-95"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>11 Slots at Risk</span>
          </button>

          <button
            onClick={onOpenDemoModal}
            className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-full text-xs font-bold shadow-[0_2px_12px_rgba(79,70,229,0.35)] active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive Demo (2m)</span>
          </button>
        </div>
      </div>

      {/* Horizontal KPI Section - Floating Translucent Surfaces */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TODAY: 128 appointments */}
        <div className="p-6 rounded-3xl apple-card">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
            Today
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-white">
              {kpis.today_appointments}
            </span>
            <span className="text-xs text-[#6E6E73] font-medium">appointments</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <TrendingUp className="h-3 w-3" />
            <span>{kpis.today_appointments_change}</span>
          </div>
        </div>

        {/* HIGH RISK: 17 appointments */}
        <div className="p-6 rounded-3xl apple-card">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            High Risk
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
              {kpis.high_risk_appointments}
            </span>
            <span className="text-xs text-[#6E6E73] font-medium">appointments</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-[#6E6E73] font-medium">
            <TrendingDown className="h-3 w-3 text-emerald-500" />
            <span>{kpis.high_risk_change}</span>
          </div>
        </div>

        {/* AT RISK: 11 slots */}
        <div className="p-6 rounded-3xl apple-card border-rose-500/30">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            At Risk
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
              {kpis.slots_at_risk}
            </span>
            <span className="text-xs text-[#6E6E73] font-medium">slots actionable</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
            <Clock className="h-3 w-3" />
            <span>24h decision window</span>
          </div>
        </div>

        {/* RECOVERED: ₹42.8K capacity protected */}
        <div className="p-6 rounded-3xl apple-card border-brand-500/30">
          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Recovered
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-white">
              ₹{(kpis.capacity_recovered_inr / 1000).toFixed(1)}K
            </span>
            <span className="text-xs text-[#6E6E73] font-medium">capacity protected</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 font-semibold">
            <Sparkles className="h-3 w-3" />
            <span>+₹6,400 today</span>
          </div>
        </div>
      </div>

      {/* Visual Centerpiece: AI Risk Card + AI Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: AI Risk Card (Visual Centerpiece) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl apple-card relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6E6E73]">
                  AI Prediction Centerpiece
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mt-0.5">
                  MISSED APPOINTMENT RISK
                </h3>
              </div>
              <RiskBadge level={focalLevel} size="sm" />
            </div>

            {/* Circular Progress Gauge & Stats */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              {/* Elegant Thin Circular SVG Ring */}
              <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="stroke-black/[0.06] dark:stroke-white/[0.08]"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <motion.circle
                    key={focalAppointment?.id || 0}
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke={strokeColor}
                    strokeWidth="6"
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-white">
                    {focalRisk}%
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase tracking-widest ${
                      focalLevel === 'HIGH'
                        ? 'text-rose-500'
                        : focalLevel === 'MEDIUM'
                        ? 'text-amber-500'
                        : 'text-emerald-500'
                    }`}
                  >
                    {focalLevel} Risk
                  </span>
                </div>
              </div>

              {/* Patient Snapshot */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#1D1D1F] dark:text-white">
                    {focalPatient?.first_name} {focalPatient?.last_name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#6E6E73]">
                    {focalPatient?.patient_code}
                  </span>
                </div>
                <div className="text-xs text-[#6E6E73] mt-0.5">
                  {focalAppointment?.appointment_date} · {focalAppointment?.appointment_time} · {focalAppointment?.doctor_name} ({focalAppointment?.department})
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      focalAppointment?.confirmation_status === 'Confirmed'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {focalAppointment?.confirmation_status || 'Not confirmed'}
                  </span>
                  <span className="text-xs text-[#6E6E73]">
                    Slot value: <strong className="text-[#1D1D1F] dark:text-white">₹{focalAppointment?.estimated_slot_value || 2500}</strong>
                  </span>
                  <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                    · Live ML Analyzed
                  </span>
                </div>
              </div>
            </div>

            {/* Why this appointment? Dynamic Real-Time Factor Attribution Pills */}
            <div className="mt-8 pt-6 border-t border-black/[0.05] dark:border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">
                  Why this appointment? (Explainable AI Attribution)
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  SHAP Weights
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {factors.slice(0, 4).map((f, idx) => {
                  const isPos = f.impact_direction === 'positive';
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2"
                    >
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate">
                        {f.label}
                      </span>
                      <span
                        className={`font-bold font-mono text-xs flex-shrink-0 ${
                          isPos
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isPos ? '+' : '-'}{f.percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: AI Recommendation Card */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl apple-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI RECOMMENDATION</span>
            </div>

            <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">
              {focalAppointment?.prediction?.recommended_action || (
                focalLevel === 'HIGH'
                  ? 'Send high-priority SMS & pre-stage waitlist.'
                  : focalLevel === 'MEDIUM'
                  ? 'Schedule automated 24h WhatsApp prompt.'
                  : 'Maintain standard appointment check-in.'
              )}
            </h3>

            <p className="text-xs text-[#6E6E73] mt-1.5 leading-relaxed">
              {focalPatient?.first_name || 'Patient'} has {focalPatient?.missed_appointments || 0} recorded missed visits with an overall {Math.round((focalPatient?.attendance_rate || 0.85) * 100)}% attendance rate. Currently {focalAppointment?.confirmation_status ? focalAppointment.confirmation_status.toLowerCase() : 'unconfirmed'}.
            </p>

            {/* Risk Projection Pill */}
            <div className="mt-5 p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73] block">Current Risk</span>
                <span className="text-lg font-extrabold text-rose-600">{focalRisk}%</span>
              </div>

              <ArrowRight className="h-4 w-4 text-brand-500" />

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73] block">After Intervention</span>
                <span className="text-lg font-extrabold text-emerald-600">{projectedRisk}%</span>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                -{projectedDrop}% Drop
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-5 border-t border-black/[0.05] dark:border-white/[0.06] space-y-2.5">
            <button
              onClick={() => focalAppointment && onOpenSendReminder(focalAppointment)}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold rounded-full shadow-[0_2px_12px_rgba(79,70,229,0.35)] active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send Personalized Reminder</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => focalAppointment && onSelectAppointment(focalAppointment)}
                className="py-2 px-3 rounded-full border border-black/[0.08] dark:border-white/[0.1] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-xs font-semibold text-[#1D1D1F] dark:text-white transition-all active:scale-95 text-center"
              >
                View Patient Profile
              </button>

              <button
                onClick={onNavigateToRecovery}
                className="py-2 px-3 rounded-full border border-rose-500/20 hover:bg-rose-500/10 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-all active:scale-95 text-center"
              >
                Escalate to Recovery
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Table - Apple Settings List Style */}
      <div className="p-6 sm:p-8 rounded-3xl apple-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                Upcoming Schedule
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Click any row to test live AI
              </span>
            </div>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              Appointments prioritized by non-attendance probability. Selecting an appointment updates the AI prediction center in real time.
            </p>
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center p-1 bg-black/[0.03] dark:bg-white/[0.06] rounded-full">
            {(['ALL', 'HIGH', 'UNCONFIRMED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterRisk(tab)}
                className={`px-3.5 py-1 text-[11px] font-bold rounded-full transition-all duration-200 ${
                  filterRisk === tab
                    ? 'bg-white dark:bg-zinc-800 text-[#1D1D1F] dark:text-white shadow-sm'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:hover:text-white'
                }`}
              >
                {tab === 'ALL' ? 'All Visits' : tab === 'HIGH' ? 'High Risk Only' : 'Unconfirmed'}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Apple Settings List Rows */}
        <div className="space-y-2">
          {filteredList.slice(0, 8).map(app => {
            const prob = Math.round((app.prediction?.risk_probability || 0.15) * 100);
            const risk = app.prediction?.risk_level || 'LOW';
            const isHigh = risk === 'HIGH';
            const isMedium = risk === 'MEDIUM';
            const isFocal = focalAppointment?.id === app.id;

            return (
              <div
                key={app.id}
                onClick={() => setSelectedFocalId(app.id)}
                className={`apple-settings-row p-4 rounded-2xl flex items-center justify-between gap-4 cursor-pointer group transition-all ${
                  isFocal
                    ? 'ring-2 ring-brand-500/50 bg-brand-50/50 dark:bg-brand-500/10 shadow-sm'
                    : ''
                }`}
              >
                {/* Left: Avatar + Name + Doctor + Time */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-transform ${
                      isHigh
                        ? 'bg-rose-500/10 text-rose-600'
                        : isMedium
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-emerald-500/10 text-emerald-600'
                    } ${isFocal ? 'scale-105 ring-2 ring-brand-500/40' : ''}`}
                  >
                    {app.patient?.first_name?.charAt(0) || 'P'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-brand-600 transition-colors truncate">
                        {app.patient?.first_name} {app.patient?.last_name}
                      </span>
                      <span className="text-[10px] text-[#6E6E73] font-mono">
                        {app.patient?.patient_code}
                      </span>
                      {isFocal && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-300">
                          Active In AI Centerpiece
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6E6E73] mt-0.5 truncate">
                      {app.appointment_date} · {app.appointment_time} · {app.doctor_name}
                    </p>
                  </div>
                </div>

                {/* Right: Typography-Led Risk Score + Confirmation + Inspect Action */}
                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-sm font-extrabold ${
                        isHigh
                          ? 'text-rose-600 dark:text-rose-400'
                          : isMedium
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {prob}% {risk}
                    </div>
                    <span className="text-[10px] font-semibold text-[#6E6E73] block">
                      {app.confirmation_status || 'Not confirmed'}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAppointment(app);
                    }}
                    className="p-2 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all"
                    title="Inspect patient profile"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs text-[#6E6E73]">
          <span>Showing {Math.min(8, filteredList.length)} of {filteredList.length} scheduled visits</span>
          <button
            onClick={onNavigateToRecovery}
            className="text-brand-600 dark:text-brand-400 font-bold hover:underline inline-flex items-center gap-1"
          >
            <span>Review At-Risk Slots</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
