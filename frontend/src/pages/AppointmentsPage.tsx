import React, { useState } from 'react';
import {
  Search,
  Calendar,
  Send,
  CheckCircle2,
  Clock,
  ChevronRight,
  Stethoscope,
  Building2,
  ArrowRight
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
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6F]">
            Clinical Schedule
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white mt-1">
            Appointments
          </h1>
          <p className="text-sm text-[#6B6B6F] mt-1">
            Monitor patient bookings, assess no-show risk, and trigger targeted reminders.
          </p>
        </div>
      </div>

      {/* Tab Filter Control */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-full w-fit max-w-full">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => onSelectTab(tab)}
            className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
              currentTab === tab
                ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm'
                : 'text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="p-2.5 bg-white/70 dark:bg-[#181818]/70 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-3.5 w-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search patient name, ID, or doctor..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] rounded-full text-[#1D1D1F] dark:text-white placeholder:text-[#6B6B6F] focus:outline-none"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
          className="text-xs font-medium bg-white dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.1] rounded-full px-3 py-1.5 text-[#1D1D1F] dark:text-zinc-200 focus:outline-none"
        >
          <option value="">All Departments</option>
          <option value="Cardiology">Cardiology</option>
          <option value="Orthopedics">Orthopedics</option>
          <option value="Neurology">Neurology</option>
          <option value="Pediatrics">Pediatrics</option>
          <option value="General Medicine">General Medicine</option>
        </select>
      </div>

      {/* Appointments List - Apple Clean Layout */}
      <div className="space-y-2">
        {filtered.map(app => {
          const prob = Math.round((app.prediction?.risk_probability || 0.2) * 100);
          const risk = app.prediction?.risk_level || 'LOW';
          const isHigh = risk === 'HIGH';
          const isMedium = risk === 'MEDIUM';

          const riskColor = isHigh ? 'text-[#C9685B]' : isMedium ? 'text-[#C18A3A]' : 'text-[#4F8A70]';
          const avatarBg = isHigh ? 'bg-[#C9685B]/10 text-[#C9685B]' : isMedium ? 'bg-[#C18A3A]/10 text-[#C18A3A]' : 'bg-[#4F8A70]/10 text-[#4F8A70]';

          return (
            <div
              key={app.id}
              onClick={() => onSelectAppointment(app)}
              className="p-4 rounded-2xl bg-white/70 dark:bg-[#181818]/70 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex items-center justify-between gap-4 cursor-pointer transition-all group"
            >
              {/* Left Column: Avatar + Name + Code + Time + Doctor + Department */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 ${avatarBg}`}>
                  {app.patient?.first_name?.charAt(0) || 'P'}{app.patient?.last_name?.charAt(0) || ''}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#1D1D1F] dark:text-white truncate">
                      {app.patient?.first_name} {app.patient?.last_name}
                    </span>
                    <span className="text-[10px] text-[#6B6B6F] font-mono">
                      {app.patient?.patient_code}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6B6F] mt-0.5 truncate">
                    {app.appointment_time} · {app.appointment_date} · {app.doctor_name} ({app.department})
                  </p>
                </div>
              </div>

              {/* Right Column: Risk probability + Risk status badge + Confirmation status + Action */}
              <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                <div className="text-right">
                  <div className={`text-sm font-semibold ${riskColor}`}>
                    {prob}% Risk
                  </div>
                  <span className="text-[10px] text-[#6B6B6F] block mt-0.5">
                    {app.confirmation_status || 'Not confirmed'}
                  </span>
                </div>

                <div className="hidden sm:block">
                  <RiskBadge level={risk} size="sm" />
                </div>

                {isHigh && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onOpenSendReminder(app);
                    }}
                    className="hidden md:inline-flex items-center gap-1 px-3 py-1 bg-[#1D1D1F] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#E5E5EA] text-white dark:text-[#1D1D1F] rounded-full text-xs font-medium shadow-sm active:scale-95 transition-all"
                  >
                    <Send className="h-3 w-3" />
                    <span>Send Reminder</span>
                  </button>
                )}

                <ChevronRight className="h-4 w-4 text-[#6B6B6F] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
