import React, { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Send,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Appointment } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';

interface AppointmentsPageProps {
  appointments: Appointment[];
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSelectAppointment: (app: Appointment) => void;
  onOpenSendReminder: (app: Appointment) => void;
}

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({
  appointments,
  currentTab,
  onSelectTab,
  onSelectAppointment,
  onOpenSendReminder,
}) => {
  const [doctorFilter, setDoctorFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = ['All', 'Today', 'High Risk', 'Medium Risk', 'Low Risk'];

  const filtered = appointments.filter(app => {
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

    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#6E6E73]">
            CLINICAL SCHEDULE
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] mt-1">
            Appointments Directory
          </h1>
          <p className="text-sm text-[#6E6E73] mt-1">
            Monitor patient bookings, assess no-show risk, and trigger multi-channel interventions.
          </p>
        </div>
      </div>

      {/* Apple Segmented Tab Control */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-black/[0.03] dark:bg-white/[0.05] rounded-full w-fit max-w-full">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => onSelectTab(tab)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 whitespace-nowrap ${
              currentTab === tab
                ? 'bg-white dark:bg-zinc-800 text-[#1D1D1F] dark:text-white shadow-sm'
                : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filter Bar with Search & Dropdowns */}
      <div className="p-3 bg-white/80 dark:bg-[#141416]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] rounded-2xl shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-3.5 w-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search patient name, ID, or doctor..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.06] rounded-full text-[#1D1D1F] dark:text-white placeholder:text-[#6E6E73] focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
          className="text-xs font-semibold bg-white dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.1] rounded-full px-3.5 py-1.5 text-[#1D1D1F] dark:text-zinc-200 focus:outline-none"
        >
          <option value="">All Departments</option>
          <option value="Cardiology">Cardiology</option>
          <option value="Orthopedics">Orthopedics</option>
          <option value="Neurology">Neurology</option>
          <option value="Pediatrics">Pediatrics</option>
          <option value="General Medicine">General Medicine</option>
        </select>
      </div>

      {/* Appointments List - Apple Settings Style */}
      <div className="space-y-2">
        {filtered.map(app => {
          const prob = Math.round((app.prediction?.risk_probability || 0.2) * 100);
          const risk = app.prediction?.risk_level || 'LOW';
          const isHigh = risk === 'HIGH';
          const isMedium = risk === 'MEDIUM';
          const isConfirmed = app.confirmation_status === 'Confirmed';

          return (
            <div
              key={app.id}
              onClick={() => onSelectAppointment(app)}
              className="apple-settings-row p-4 rounded-2xl flex items-center justify-between gap-4 cursor-pointer group"
            >
              {/* Left Column: Avatar + Name + Code + Time + Doctor */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    isHigh
                      ? 'bg-rose-500/10 text-rose-600'
                      : isMedium
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-emerald-500/10 text-emerald-600'
                  }`}
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
                  </div>
                  <p className="text-xs text-[#6E6E73] mt-0.5 truncate">
                    {app.appointment_date} · {app.appointment_time} · {app.doctor_name} ({app.department})
                  </p>
                </div>
              </div>

              {/* Right Column: Risk typography + Confirmation pill + Action */}
              <div className="flex items-center gap-4 flex-shrink-0">
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

                {isHigh && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onOpenSendReminder(app);
                    }}
                    className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-full text-[11px] font-bold shadow-sm active:scale-95 transition-all"
                  >
                    <Send className="h-3 w-3" />
                    <span>Send SMS</span>
                  </button>
                )}

                <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
