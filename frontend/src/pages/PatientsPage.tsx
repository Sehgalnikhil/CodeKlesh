import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  CalendarPlus,
  Activity,
  History,
  ShieldCheck
} from 'lucide-react';
import { Patient } from '../types';

interface PatientsPageProps {
  patients: Patient[];
  onOpenAddPatient: () => void;
  onBookForPatient: (patientId: number) => void;
}

export const PatientsPage: React.FC<PatientsPageProps> = ({
  patients,
  onOpenAddPatient,
  onBookForPatient,
}) => {
  const [search, setSearch] = useState('');

  const filtered = patients.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    return name.includes(q) || p.patient_code.toLowerCase().includes(q) || p.phone.includes(q);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Patient Directory
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Browse registered clinic patients, past adherence records, and risk profiles.
          </p>
        </div>

        <button
          onClick={onOpenAddPatient}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-soft transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl shadow-soft">
        <div className="relative max-w-md">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient name, phone, or code (e.g. Aarav Mehta, PT-10482)..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-50/70 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-400 font-medium">
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Demographics</th>
                <th className="py-3 px-4">Phone / Email</th>
                <th className="py-3 px-4">Distance</th>
                <th className="py-3 px-4">Insurance</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Prior Missed</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filtered.map(patient => {
                const attPct = Math.round(patient.attendance_rate * 100);
                return (
                  <tr key={patient.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <span className="font-mono text-[11px] text-zinc-400">
                        {patient.patient_code}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                      {patient.age} yrs · {patient.gender}
                      {patient.chronic_condition && (
                        <span className="block text-[10px] text-brand-600 font-medium mt-0.5">
                          Chronic Care
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                      <div>{patient.phone}</div>
                      <div className="text-[11px] text-zinc-400 truncate max-w-[140px]">{patient.email || '—'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                      {patient.distance_km} km
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {patient.insurance_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 min-w-[130px]">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{attPct}%</span>
                        <span className="text-zinc-400">{patient.total_appointments - patient.missed_appointments}/{patient.total_appointments}</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            attPct >= 80 ? 'bg-emerald-500' : attPct >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${attPct}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-xs ${
                          patient.missed_appointments > 1
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : patient.missed_appointments === 1
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'text-zinc-400'
                        }`}
                      >
                        {patient.missed_appointments} missed
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onBookForPatient(patient.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 text-zinc-800 dark:text-zinc-200 rounded-md text-[11px] font-medium shadow-soft transition-all"
                      >
                        <CalendarPlus className="h-3 w-3 text-brand-600" />
                        <span>Book Appt</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
          Showing {filtered.length} patients in clinical registry
        </div>
      </div>
    </div>
  );
};
