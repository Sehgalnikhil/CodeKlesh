import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  ChevronRight,
  Filter,
  Stethoscope,
  Sparkles,
  SlidersHorizontal,
  MessageCircle,
  Compass,
} from 'lucide-react';
import { Appointment } from '../types';

interface AppointmentsPageProps {
  appointments: Appointment[];
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSelectAppointment: (app: Appointment) => void;
  onOpenSendReminder: (app: Appointment) => void;
  onOpenWhatsApp?: (app: Appointment) => void;
  onOpenRadar?: (app: Appointment) => void;
}

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({
  appointments,
  currentTab,
  onSelectTab,
  onSelectAppointment,
  onOpenSendReminder,
  onOpenWhatsApp,
  onOpenRadar,
}) => {
  const [doctorFilter, setDoctorFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = ['All', 'High Risk', 'Medium Risk', 'Low Risk', 'Unconfirmed'];

  // Tab counts for quick at-a-glance triage
  const tabCounts = useMemo(() => {
    return {
      All: appointments.length,
      'High Risk': appointments.filter((a) => a.prediction?.risk_level === 'HIGH').length,
      'Medium Risk': appointments.filter((a) => a.prediction?.risk_level === 'MEDIUM').length,
      'Low Risk': appointments.filter((a) => a.prediction?.risk_level === 'LOW').length,
      Unconfirmed: appointments.filter((a) => a.confirmation_status !== 'Confirmed').length,
    };
  }, [appointments]);

  // Filter appointments (Memoized to prevent unnecessary re-computations)
  const filtered = useMemo(() => {
    return appointments.filter((app) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = `${app.patient?.first_name} ${app.patient?.last_name}`.toLowerCase();
        const code = (app.patient?.patient_code || '').toLowerCase();
        const doc = app.doctor_name.toLowerCase();
        if (!name.includes(q) && !code.includes(q) && !doc.includes(q)) return false;
      }

      if (doctorFilter && !app.doctor_name.includes(doctorFilter)) return false;
      if (departmentFilter && !app.department.includes(departmentFilter)) return false;

      if (currentTab === 'High Risk') return app.prediction?.risk_level === 'HIGH';
      if (currentTab === 'Medium Risk') return app.prediction?.risk_level === 'MEDIUM';
      if (currentTab === 'Low Risk') return app.prediction?.risk_level === 'LOW';
      if (currentTab === 'Unconfirmed') return app.confirmation_status !== 'Confirmed';

      return true;
    });
  }, [appointments, searchQuery, doctorFilter, departmentFilter, currentTab]);

  // Unique doctors and departments for quick filtering
  const doctors = useMemo(
    () => Array.from(new Set(appointments.map((a) => a.doctor_name).filter(Boolean))),
    [appointments]
  );
  const departments = useMemo(
    () => Array.from(new Set(appointments.map((a) => a.department).filter(Boolean))),
    [appointments]
  );

  // Group appointments by time slot
  const timeSlots = [
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '12:00 PM',
    '12:30 PM',
    '01:00 PM',
    '01:30 PM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
    '03:30 PM',
    '04:00 PM',
    '04:30 PM',
    '05:00 PM',
  ];

  // Group filtered items by their appointment_time (Memoized)
  const groupedByTime = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    filtered.forEach((app) => {
      const t = app.appointment_time || '10:00 AM';
      if (!grouped[t]) grouped[t] = [];
      grouped[t].push(app);
    });
    return grouped;
  }, [filtered]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-steel-500">
            Clinical Operations Board
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-graphite-900 mt-1">
            Appointments Timeline
          </h1>
          <p className="text-xs md:text-sm text-charcoal-700 mt-1">
            Spatial chronological view. Risk is encoded in material elevation and color cues.
          </p>
        </div>

        {/* Tab Filters with Dynamic Counts */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 rounded-full w-fit overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const count = tabCounts[tab as keyof typeof tabCounts];
            const isSelected = currentTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onSelectTab(tab)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                  isSelected
                    ? 'bg-graphite-900 text-porcelain-100 shadow-spatial-soft'
                    : 'text-charcoal-700 hover:text-graphite-900 hover:bg-stone-300/60'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : tab === 'High Risk'
                      ? 'bg-rose-200/80 text-rose-800'
                      : tab === 'Unconfirmed'
                      ? 'bg-amber-200/80 text-amber-800'
                      : 'bg-stone-300/80 text-stone-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-3 bg-stone-100/90 border border-stone-200/90 rounded-2xl shadow-spatial-soft flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-steel-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter patient name, ID, or doctor..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-porcelain-100 border border-stone-200 rounded-full text-graphite-900 placeholder:text-steel-500 focus:outline-none"
          />
        </div>

        {/* Doctor Filter */}
        <select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-porcelain-100 border border-stone-200 rounded-full text-charcoal-700 focus:outline-none"
        >
          <option value="">All Doctors ({doctors.length})</option>
          {doctors.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Department Filter */}
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-porcelain-100 border border-stone-200 rounded-full text-charcoal-700 focus:outline-none"
        >
          <option value="">All Departments ({departments.length})</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* SPATIAL TIMELINE BOARD (Replacing table) */}
      <div className="relative pl-6 md:pl-24 space-y-6">
        {/* Continuous vertical timeline ruler */}
        <div className="absolute left-2 md:left-20 top-2 bottom-4 w-0.5 spatial-timeline-line" />

        {timeSlots.map((time) => {
          const slotApps = groupedByTime[time] || [];
          const hasAppointments = slotApps.length > 0;

          return (
            <div key={time} className="relative flex flex-col md:flex-row items-start gap-4 md:gap-8 group">
              {/* Time Label on ruler */}
              <div className="md:w-20 md:-ml-24 flex items-center gap-2 pt-2">
                <span
                  className={`text-xs font-mono font-bold tracking-tight ${
                    hasAppointments ? 'text-graphite-900' : 'text-stone-400'
                  }`}
                >
                  {time}
                </span>
                {/* Node pin on ruler */}
                <span
                  className={`w-2.5 h-2.5 rounded-full border-2 border-porcelain-100 transition-all ${
                    hasAppointments ? 'bg-graphite-900 ring-2 ring-stone-300' : 'bg-stone-300'
                  }`}
                />
              </div>

              {/* Slot Content: Empty or Cards */}
              <div className="flex-1 w-full">
                {hasAppointments ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slotApps.map((app) => {
                      const prob = Math.round((app.prediction?.risk_probability || 0.15) * 100);
                      const isHigh = app.prediction?.risk_level === 'HIGH';
                      const isMedium = app.prediction?.risk_level === 'MEDIUM';
                      const isConfirmed = app.confirmation_status === 'Confirmed';

                      return (
                        <motion.div
                          key={app.id}
                          whileHover={{ y: -2 }}
                          onClick={() => onSelectAppointment(app)}
                          className={`p-4 rounded-2xl cursor-pointer transition-all border relative overflow-hidden ${
                            isHigh
                              ? 'bg-porcelain-50 border-coral-500/40 shadow-spatial-card hover:border-coral-500'
                              : isMedium
                              ? 'bg-porcelain-50 border-amber-500/40 shadow-spatial-soft hover:border-amber-500'
                              : 'bg-stone-50 border-stone-200/80 shadow-spatial-soft hover:border-stone-400'
                          }`}
                        >
                          {/* Accent line on left edge */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1 ${
                              isHigh ? 'bg-coral-500' : isMedium ? 'bg-amber-500' : 'bg-sage-500'
                            }`}
                          />

                          {/* Top: Time & Risk Pill */}
                          <div className="flex items-center justify-between pl-1">
                            <span className="text-[11px] font-mono text-steel-500">
                              {app.appointment_type || 'Consultation'}
                            </span>
                            <span
                              className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                                isHigh
                                  ? 'bg-coral-100 text-coral-600'
                                  : isMedium
                                  ? 'bg-amber-100 text-amber-600'
                                  : 'bg-sage-100 text-eucalyptus-600'
                              }`}
                            >
                              {prob}% RISK
                            </span>
                          </div>

                          {/* Middle: Patient & Doctor */}
                          <div className="mt-2 pl-1">
                            <h3 className="text-sm font-bold text-graphite-900 tracking-tight">
                              {app.patient?.first_name} {app.patient?.last_name}
                            </h3>
                            <p className="text-xs text-charcoal-700 mt-0.5">
                              {app.doctor_name} · {app.department}
                            </p>
                          </div>

                          {/* Bottom: Status & Quick Action */}
                          <div className="mt-3 pt-3 border-t border-stone-200/80 flex items-center justify-between pl-1 text-xs">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                isConfirmed ? 'text-eucalyptus-600' : 'text-amber-600'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isConfirmed ? 'bg-eucalyptus-500' : 'bg-amber-500'
                                }`}
                              />
                              {app.confirmation_status || 'Pending'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {onOpenWhatsApp && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenWhatsApp(app);
                                  }}
                                  className="p-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] transition-all"
                                  title="Open WhatsApp Outpatient Desk"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onOpenRadar && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenRadar(app);
                                  }}
                                  className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] transition-all"
                                  title="View Live Journey Radar"
                                >
                                  <Compass className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {!isConfirmed && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenSendReminder(app);
                                  }}
                                  className="px-2.5 py-1 rounded-full bg-graphite-900 hover:bg-charcoal-800 text-porcelain-100 text-[10px] font-semibold flex items-center gap-1 transition-all"
                                >
                                  <Send className="w-2.5 h-2.5" />
                                  <span>Intervene</span>
                                </button>
                              )}
                              <ChevronRight className="w-3.5 h-3.5 text-steel-500 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-2 border-b border-dashed border-stone-200/80 text-[11px] text-stone-400 font-mono">
                    No scheduled appointments in this window
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
