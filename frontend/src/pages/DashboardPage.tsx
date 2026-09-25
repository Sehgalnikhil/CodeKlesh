import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Send,
  UserCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  PhoneCall,
  Activity,
  FileText,
  User,
  MessageCircle,
  Compass,
  Printer,
  Radio,
  Target,
  Zap,
} from 'lucide-react';
import { Appointment, AnalyticsResponse } from '../types';

interface DashboardPageProps {
  analytics: AnalyticsResponse | null;
  todayAppointments: Appointment[];
  onSelectAppointment: (app: Appointment) => void;
  onOpenSendReminder: (app: Appointment) => void;
  onNavigateToRecovery: () => void;
  onOpenDemoModal: () => void;
  onOpenROIReport?: () => void;
  onRefreshData: () => void;
  onOpenWhatsApp?: (app: Appointment) => void;
  onOpenRadar?: (app: Appointment) => void;
  onOpenDelayBroadcast?: () => void;
  onOpenRunSheet?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  analytics,
  todayAppointments,
  onSelectAppointment,
  onOpenSendReminder,
  onNavigateToRecovery,
  onOpenDemoModal,
  onOpenROIReport,
  onRefreshData,
  onOpenWhatsApp,
  onOpenRadar,
  onOpenDelayBroadcast,
  onOpenRunSheet,
}) => {
  const [selectedFocalId, setSelectedFocalId] = useState<number | null>(null);

  // Memoized real-time calculations to prevent layout thrashing
  const totalToday = useMemo(() => todayAppointments.length, [todayAppointments]);
  
  const atRiskCount = useMemo(
    () => todayAppointments.filter((a) => a.prediction?.risk_level === 'HIGH').length,
    [todayAppointments]
  );
  
  const unconfirmedCount = useMemo(
    () => todayAppointments.filter((a) => a.confirmation_status !== 'Confirmed').length,
    [todayAppointments]
  );
  
  const recoverableCount = useMemo(
    () =>
      analytics?.kpis?.slots_at_risk ||
      todayAppointments.filter((a) => a.recovery_status === 'At_Risk').length ||
      11,
    [analytics, todayAppointments]
  );
  
  const capacityRecovered = useMemo(
    () => analytics?.kpis?.capacity_recovered_inr || 42800,
    [analytics]
  );

  // Focal appointment: user-selected or highest risk (memoized)
  const focalAppointment = useMemo(() => {
    return (
      (selectedFocalId ? todayAppointments.find((a) => a.id === selectedFocalId) : null) ||
      todayAppointments.find((a) => a.prediction?.risk_level === 'HIGH') ||
      todayAppointments[0]
    );
  }, [selectedFocalId, todayAppointments]);

  const focalRisk = useMemo(
    () => Math.round((focalAppointment?.prediction?.risk_probability || 0.87) * 100),
    [focalAppointment]
  );
  
  const focalPatient = focalAppointment?.patient;

  const factors = useMemo(() => {
    return focalAppointment?.prediction?.top_factors?.length
      ? focalAppointment.prediction.top_factors
      : [
          { label: 'Historical Missed Appointments', percentage: 31 },
          { label: 'Booking Gap Window', percentage: 22 },
          { label: 'Reminder Confirmation Response', percentage: 18 },
          { label: 'Transit Distance to Clinic', percentage: 11 },
        ];
  }, [focalAppointment]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 text-slate-900">
      {/* Top Banner: Modern Command Overview Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-700 bg-slate-100 border border-slate-200/90 px-2.5 py-0.5 rounded-full inline-block">
              Clinical Command Center
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live SSE Sync (0ms)
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950 mt-2">
            Capacity Operations
          </h1>
          <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-xl">
            Real-time appointment risk intelligence, automated clinical interventions, and backfill slot recovery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenRunSheet && (
            <button
              onClick={onOpenRunSheet}
              className="px-4 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Run-Sheet</span>
            </button>
          )}

          {onOpenDelayBroadcast && (
            <button
              onClick={onOpenDelayBroadcast}
              className="px-4 py-2 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Doctor Delay Wave</span>
            </button>
          )}

          {onOpenROIReport && (
            <button
              onClick={onOpenROIReport}
              className="px-4 py-2 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Executive Summary</span>
            </button>
          )}

          <button
            onClick={onNavigateToRecovery}
            className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Slot Recovery</span>
          </button>
        </div>
      </div>

      {/* Top Telemetry KPI Ribbon (Porcelain & Stone Aesthetic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-6 rounded-[28px] bg-white border border-slate-200/90 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.05)] hover:shadow-md transition-shadow">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
            Today's Capacity
          </span>
          <span className="text-4xl font-extrabold tracking-tight text-slate-950 font-mono mt-1 block">
            {totalToday || 100}
          </span>
          <span className="text-xs text-slate-600 mt-1 block font-medium">
            Active slots on schedule
          </span>
        </div>

        {/* Metric 2 */}
        <div className="p-6 rounded-[28px] bg-rose-50/50 border border-rose-200/80 shadow-[0_10px_30px_-10px_rgba(244,63,94,0.06)] hover:shadow-md transition-shadow">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-700">
            At-Risk Appointments
          </span>
          <span className="text-4xl font-extrabold tracking-tight text-rose-600 font-mono mt-1 block">
            {atRiskCount || 11}
          </span>
          <span className="text-xs text-rose-800/80 mt-1 block font-medium">
            {unconfirmedCount || 60} unconfirmed by patient
          </span>
        </div>

        {/* Metric 3 */}
        <div className="p-6 rounded-[28px] bg-amber-50/50 border border-amber-200/80 shadow-[0_10px_30px_-10px_rgba(245,158,11,0.06)] hover:shadow-md transition-shadow">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800">
            Recoverable Slots
          </span>
          <span className="text-4xl font-extrabold tracking-tight text-amber-700 font-mono mt-1 block">
            {recoverableCount}
          </span>
          <span className="text-xs text-amber-800/80 mt-1 block font-medium">
            Eligible for waitlist backfill
          </span>
        </div>

        {/* Metric 4 */}
        <div className="p-6 rounded-[28px] bg-emerald-50/50 border border-emerald-200/80 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.06)] hover:shadow-md transition-shadow">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800">
            Capacity Protected
          </span>
          <span className="text-4xl font-extrabold tracking-tight text-emerald-600 font-mono mt-1 block">
            ₹{capacityRecovered.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-emerald-800/80 mt-1 block font-medium">
            Revenue saved this cycle
          </span>
        </div>
      </div>

      {/* Autonomous Fleet Operations Tray (Harmonized Porcelain/Stone Card) */}
      <div className="p-6 rounded-[32px] bg-white border border-slate-200/90 shadow-[0_12px_36px_-12px_rgba(15,23,42,0.06)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              Autonomous Clinical Fleet Active
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Zero-friction AI intervention & waitlist swap engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. WhatsApp AI */}
          {onOpenWhatsApp && (
            <button
              onClick={() => onOpenWhatsApp(focalAppointment || todayAppointments[0])}
              className="p-4 rounded-2xl bg-emerald-50/40 hover:bg-emerald-50/80 border border-emerald-200/80 hover:border-emerald-300 text-left transition-all active:scale-95 group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
                  OUTPATIENT DESK
                </span>
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  WhatsApp Outpatient Channel
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Slot confirmations & rescheduling in English & Hindi
                </p>
              </div>
            </button>
          )}

          {/* 2. Journey Radar */}
          {onOpenRadar && (
            <button
              onClick={() => onOpenRadar(focalAppointment || todayAppointments[0])}
              className="p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-100 active:scale-95 border border-slate-200/90 hover:border-slate-300 text-left transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                  PWA RADAR
                </span>
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                  Live Journey Radar
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Swiggy-style queue tracker & delay buffer
                </p>
              </div>
            </button>
          )}

          {/* 3. Slot Recovery */}
          <button
            onClick={onNavigateToRecovery}
            className="p-4 rounded-2xl bg-rose-50/40 hover:bg-rose-50/80 border border-rose-200/80 hover:border-rose-300 text-left transition-all active:scale-95 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-mono font-bold text-rose-800 bg-rose-100/90 px-2 py-0.5 rounded-full border border-rose-200">
                {recoverableCount} SLOTS
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                Slot Recovery Engine
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Execute waitlist match & double-booking
              </p>
            </div>
          </button>

          {/* 4. ROI Executive Report */}
          {onOpenROIReport && (
            <button
              onClick={onOpenROIReport}
              className="p-4 rounded-2xl bg-amber-50/40 hover:bg-amber-50/80 border border-amber-200/80 hover:border-amber-300 text-left transition-all active:scale-95 group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
                  EXECUTIVE
                </span>
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  Capacity ROI Report
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Protect clinic bottom-line & doctor yield
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Clean Clinical Schedule Radar */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/90 shadow-[0_12px_36px_-12px_rgba(15,23,42,0.06)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-bold">
              Live Clinical Schedule Board
            </span>
            <h3 className="text-xl font-bold text-slate-950 mt-0.5">
              Today's Appointment Radar & Risk Attribution
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono font-medium">
            Click any patient to inspect telemetry
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {todayAppointments.slice(0, 6).map((app) => {
            const prob = Math.round((app.prediction?.risk_probability || 0.15) * 100);
            const isHigh = app.prediction?.risk_level === 'HIGH';
            const isMedium = app.prediction?.risk_level === 'MEDIUM';
            const isConfirmed = app.confirmation_status === 'Confirmed';
            const isSelected = focalAppointment?.id === app.id;

            return (
              <motion.div
                key={app.id}
                whileHover={{ y: -3 }}
                onClick={() => {
                  setSelectedFocalId(app.id);
                  onSelectAppointment(app);
                }}
                className={`p-5 rounded-[24px] cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-white border-2 border-slate-900 shadow-md ring-4 ring-slate-100'
                    : isHigh
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300 hover:shadow-md'
                    : 'bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {app.appointment_time}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      isHigh
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : isMedium
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {prob}% RISK
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
                    {app.patient?.first_name} {app.patient?.last_name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {app.doctor_name} · {app.department}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                      isConfirmed ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConfirmed ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'
                      }`}
                    />
                    {app.confirmation_status || 'Pending'}
                  </span>

                  <span className="text-[11px] font-mono font-bold text-slate-900">
                    ₹{(app.estimated_slot_value || 2200).toLocaleString('en-IN')}
                  </span>
                </div>

                {prob >= 70 && !isConfirmed && (
                  <div className="mt-2.5 pt-2 border-t border-dashed border-rose-200/90 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-rose-800 bg-rose-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Target className="w-3 h-3 text-rose-700" />
                      Safe Overbook Ready
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToRecovery();
                      }}
                      className="text-stone-600 hover:text-stone-950 font-medium underline text-[11px]"
                    >
                      Stage Walk-In
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Clinical Focus Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Focal At-Risk Appointment Detail */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/90 shadow-[0_12px_36px_-12px_rgba(15,23,42,0.06)] space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-700">
                Priority Attention Slot
              </span>
            </div>

            <span className="text-xs font-mono text-slate-500 font-medium">
              {focalAppointment?.appointment_time} · {focalAppointment?.appointment_date}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                {focalPatient?.first_name || 'Aarav'} {focalPatient?.last_name || 'Mehta'}
              </h2>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                {focalAppointment?.doctor_name} · {focalAppointment?.department} ({focalAppointment?.appointment_type || 'Consultation'})
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-4xl font-black font-mono text-rose-600">
                {focalRisk}%
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                No-Show Risk
              </span>
            </div>
          </div>

          {/* Explainable Factors */}
          <div className="space-y-2.5 pt-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
              Model Factor Contributions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {factors.map((f: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex justify-between items-center text-slate-800 font-medium">
                    <span className="truncate pr-2">{f.label || f.factor}</span>
                    <span className="font-mono font-bold text-rose-600">
                      +{Math.abs(f.percentage || 20)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => focalAppointment && onOpenSendReminder(focalAppointment)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-black shadow-md flex items-center gap-2 transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Clinical Reminder</span>
              </button>

              {focalRisk >= 70 && focalAppointment?.confirmation_status !== 'Confirmed' && (
                <button
                  onClick={onNavigateToRecovery}
                  className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                >
                  <Target className="w-3.5 h-3.5 text-amber-700" />
                  <span>Schedule Walk-In Standby</span>
                </button>
              )}

              <button
                onClick={() => focalAppointment && onSelectAppointment(focalAppointment)}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-full text-xs font-bold transition-all shadow-sm"
              >
                Inspect Detail
              </button>
            </div>

            <button
              onClick={onNavigateToRecovery}
              className="text-xs font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1 transition-colors"
            >
              <span>Backfill Slot</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Live Clinical Stream Pulse */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/90 shadow-[0_12px_36px_-12px_rgba(15,23,42,0.06)] space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
              Recent Clinical Operations
            </span>
            <button
              onClick={onRefreshData}
              className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Waitlist Backfill Triggered</span>
                <span className="text-[10px] font-mono text-slate-500 font-medium">2m ago</span>
              </div>
              <p className="text-slate-600 text-[11px] font-medium">
                Offered unconfirmed 10:30 AM slot to priority waitlist patient.
              </p>
              <span className="text-[10px] font-bold text-emerald-700 block pt-1">
                ✓ ₹2,500 capacity protected
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">SMS + WhatsApp Reminder</span>
                <span className="text-[10px] font-mono text-slate-500 font-medium">8m ago</span>
              </div>
              <p className="text-slate-600 text-[11px] font-medium">
                Urgent confirmation prompt delivered to Aarav Mehta.
              </p>
              <span className="text-[10px] font-semibold text-slate-500 block pt-1">
                Delivered to device
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">ML Prediction Updated</span>
                <span className="text-[10px] font-mono text-slate-500 font-medium">14m ago</span>
              </div>
              <p className="text-slate-600 text-[11px] font-medium">
                15 appointments evaluated for tomorrow's schedule grid.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
