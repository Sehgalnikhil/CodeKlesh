import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ShieldCheck,
  X,
  Clock,
  Calendar,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Patient, Appointment } from '../types';
import { api } from '../api/client';

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
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    try {
      setLoadingAppts(true);
      const appts = await api.getAppointments({ search: patient.patient_code });
      setPatientAppointments(appts);
    } catch {
      setPatientAppointments([]);
    } finally {
      setLoadingAppts(false);
    }
  };

  const filtered = patients.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      const name = `${p.first_name} ${p.last_name}`.toLowerCase();
      const code = (p.patient_code || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      if (!name.includes(q) && !code.includes(q) && !phone.includes(q)) return false;
    }

    const attPct = p.attendance_rate * 100;
    if (attendanceFilter === 'HIGH' && attPct < 80) return false;
    if (attendanceFilter === 'MEDIUM' && (attPct < 60 || attPct >= 80)) return false;
    if (attendanceFilter === 'LOW' && attPct >= 60) return false;

    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6F]">
            Registry
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white mt-1">
            Patient Directory
          </h1>
          <p className="text-sm text-[#6B6B6F] mt-1">
            Historical attendance records, contact preferences, and risk profiles.
          </p>
        </div>

        <button
          onClick={onOpenAddPatient}
          className="px-4 py-2 bg-[#1D1D1F] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#E5E5EA] text-white dark:text-[#1D1D1F] rounded-full text-xs font-medium shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Register Patient</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-2.5 bg-white/70 dark:bg-[#181818]/70 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="h-3.5 w-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6F]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, or code (e.g. Aarav Mehta, PT-10482)..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] rounded-full text-[#1D1D1F] dark:text-white placeholder:text-[#6B6B6F] focus:outline-none"
          />
        </div>

        <div className="flex items-center p-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-full">
          {[
            { id: 'ALL', label: 'All Adherence' },
            { id: 'HIGH', label: 'High (>80%)' },
            { id: 'MEDIUM', label: 'Moderate (60–80%)' },
            { id: 'LOW', label: 'At-Risk (<60%)' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setAttendanceFilter(f.id as any)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                attendanceFilter === f.id
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm'
                  : 'text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patients Table Card */}
      <div className="rounded-2xl bg-white/70 dark:bg-[#181818]/70 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/[0.04] dark:border-white/[0.06] text-[#6B6B6F] font-semibold text-[11px]">
                <th className="py-3 px-5">Patient</th>
                <th className="py-3 px-4">Demographics</th>
                <th className="py-3 px-4">Phone / Contact</th>
                <th className="py-3 px-4">Distance</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Prior Misses</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
              {filtered.map(patient => {
                const attPct = Math.round(patient.attendance_rate * 100);
                const isHighRisk = attPct < 60 || patient.missed_appointments >= 2;

                return (
                  <tr
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#1D1D1F] dark:text-white">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <span className="font-mono text-[10px] text-[#6B6B6F]">
                        {patient.patient_code}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#6B6B6F]">
                      {patient.age} yrs · {patient.gender}
                      {patient.chronic_condition && (
                        <span className="block text-[10px] text-[#647A8A] font-medium mt-0.5">
                          Chronic Care
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#6B6B6F]">
                      <div>{patient.phone}</div>
                      <div className="text-[10px] text-[#6B6B6F] truncate max-w-[140px]">{patient.email || '—'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-[#6B6B6F]">
                      {patient.distance_km} km
                    </td>

                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-[#1D1D1F] dark:text-white">{attPct}%</span>
                        <span className="text-[#6B6B6F] text-[10px]">
                          {patient.total_appointments - patient.missed_appointments}/{patient.total_appointments} visits
                        </span>
                      </div>
                      <div className="w-full bg-black/[0.04] dark:bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            attPct >= 80 ? 'bg-[#4F8A70]' : attPct >= 60 ? 'bg-[#C18A3A]' : 'bg-[#C9685B]'
                          }`}
                          style={{ width: `${attPct}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                          patient.missed_appointments > 1
                            ? 'bg-[#C9685B]/10 text-[#C9685B]'
                            : patient.missed_appointments === 1
                            ? 'bg-[#C18A3A]/10 text-[#C18A3A]'
                            : 'text-[#6B6B6F]'
                        }`}
                      >
                        {patient.missed_appointments} missed
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onBookForPatient(patient.id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-black/[0.08] dark:border-white/[0.1] text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
                      >
                        <CalendarPlus className="h-3 w-3" />
                        <span>Book</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Profile Drawer/Sheet */}
      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPatient(null)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-lg m-2 sm:m-4 rounded-[28px] bg-white/90 dark:bg-[#181818]/90 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col justify-between overflow-hidden z-10"
            >
              <div className="p-6 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-semibold text-sm">
                    {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#1D1D1F] dark:text-white">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-[#6B6B6F] mt-0.5">
                      <span className="font-mono bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.2 rounded text-[11px] font-medium text-[#1D1D1F] dark:text-white">
                        {selectedPatient.patient_code}
                      </span>
                      <span>·</span>
                      <span>{selectedPatient.age} yrs</span>
                      <span>·</span>
                      <span>{selectedPatient.gender}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPatient(null)}
                  className="h-8 w-8 rounded-full border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 3 Metrics Cards */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                    <span className="text-[10px] text-[#6B6B6F] font-semibold uppercase block">Attendance</span>
                    <span className="text-xl font-semibold text-[#1D1D1F] dark:text-white mt-1 block">
                      {Math.round(selectedPatient.attendance_rate * 100)}%
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                    <span className="text-[10px] text-[#6B6B6F] font-semibold uppercase block">Total Visits</span>
                    <span className="text-xl font-semibold text-[#1D1D1F] dark:text-white mt-1 block">
                      {selectedPatient.total_appointments}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                    <span className="text-[10px] text-[#6B6B6F] font-semibold uppercase block">No-Shows</span>
                    <span className="text-xl font-semibold text-[#C9685B] mt-1 block">
                      {selectedPatient.missed_appointments}
                    </span>
                  </div>
                </div>

                {/* Behavioral & Clinical Markers */}
                <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6F] block">
                    Patient Behavioral Patterns
                  </span>
                  <div className="space-y-1.5 text-[#1D1D1F] dark:text-white">
                    <p>• Prefers SMS & WhatsApp confirmation over voice phone calls.</p>
                    <p>• Distance: {selectedPatient.distance_km} km from facility · Insurance: {selectedPatient.insurance_type}.</p>
                    <p>• {selectedPatient.chronic_condition ? 'Enrolled in Chronic Care Monitoring protocol.' : 'Standard outpatient preventive track.'}</p>
                  </div>
                </div>

                {/* Appointments History */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6F] block">
                    Appointment Records ({patientAppointments.length})
                  </span>

                  {loadingAppts ? (
                    <p className="text-xs text-[#6B6B6F]">Loading records...</p>
                  ) : patientAppointments.length === 0 ? (
                    <p className="text-xs text-[#6B6B6F]">No past appointments found in system.</p>
                  ) : (
                    <div className="space-y-2">
                      {patientAppointments.map(app => (
                        <div
                          key={app.id}
                          className="p-3 rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-[#1D1D1F] dark:text-white">
                              {app.doctor_name} ({app.department})
                            </div>
                            <div className="text-[11px] text-[#6B6B6F]">
                              {app.appointment_date} · {app.appointment_time}
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            app.confirmation_status === 'Confirmed'
                              ? 'bg-[#4F8A70]/10 text-[#4F8A70]'
                              : app.status === 'Cancelled'
                              ? 'bg-[#C9685B]/10 text-[#C9685B]'
                              : 'bg-[#C18A3A]/10 text-[#C18A3A]'
                          }`}>
                            {app.confirmation_status || app.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-black/[0.08] dark:border-white/[0.1] text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const id = selectedPatient.id;
                    setSelectedPatient(null);
                    onBookForPatient(id);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] hover:bg-[#2C2C2E]"
                >
                  Book New Appointment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
