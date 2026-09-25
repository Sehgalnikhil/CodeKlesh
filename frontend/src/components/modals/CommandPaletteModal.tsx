import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CalendarPlus,
  UserPlus,
  ShieldAlert,
  AlertTriangle,
  PlayCircle,
  ArrowRight,
  User,
  Moon,
  Sun,
  Calendar,
  Stethoscope,
  Building2,
  Clock
} from 'lucide-react';
import { Patient, Appointment } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  appointments?: Appointment[];
  onSelectPatient: (patientId: number) => void;
  onSelectAppointment?: (app: Appointment) => void;
  onNavigateTab: (tab: any) => void;
  onOpenBookAppointment: () => void;
  onOpenAddPatient: () => void;
  onOpenDemoModal: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  patients,
  appointments = [],
  onSelectPatient,
  onSelectAppointment,
  onNavigateTab,
  onOpenBookAppointment,
  onOpenAddPatient,
  onOpenDemoModal,
}) => {
  const [query, setQuery] = useState('');
  const { darkMode, toggleDarkMode } = useAuth();

  // Keyboard shortcut listener for ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Filter Patients
  const filteredPatients = q
    ? patients.filter(p =>
        `${p.first_name} ${p.last_name} ${p.patient_code} ${p.phone}`
          .toLowerCase()
          .includes(q)
      ).slice(0, 4)
    : [];

  // Filter Appointments by Doctor, Department, or ID (e.g. #42, APT-42, 10:30, Sharma)
  const filteredAppointments = q
    ? appointments.filter(a => {
        const idMatch = `apt-${a.id} #${a.id} ${a.id}`.toLowerCase().includes(q);
        const docMatch = (a.doctor_name || '').toLowerCase().includes(q);
        const deptMatch = (a.department || '').toLowerCase().includes(q);
        const patMatch = a.patient ? `${a.patient.first_name} ${a.patient.last_name}`.toLowerCase().includes(q) : false;
        const timeMatch = (a.appointment_time || '').toLowerCase().includes(q);
        return idMatch || docMatch || deptMatch || patMatch || timeMatch;
      }).slice(0, 4)
    : [];

  const quickActions = [
    {
      id: 'book',
      label: 'Book New Appointment',
      icon: <CalendarPlus className="h-4 w-4 text-[#1D1D1F] dark:text-white" />,
      action: () => {
        onClose();
        onOpenBookAppointment();
      },
    },
    {
      id: 'recovery',
      label: 'Open Slot Recovery Center',
      icon: <ShieldAlert className="h-4 w-4 text-[#C9685B]" />,
      action: () => {
        onClose();
        onNavigateTab('recovery');
      },
    },
    {
      id: 'risk',
      label: 'View Priority Risk Queue',
      icon: <AlertTriangle className="h-4 w-4 text-[#C18A3A]" />,
      action: () => {
        onClose();
        onNavigateTab('risk-queue');
      },
    },
    {
      id: 'add_patient',
      label: 'Register New Patient',
      icon: <UserPlus className="h-4 w-4 text-[#4F8A70]" />,
      action: () => {
        onClose();
        onOpenAddPatient();
      },
    },
    {
      id: 'demo',
      label: 'Run Clinical Workflow Simulation',
      icon: <PlayCircle className="h-4 w-4 text-[#647A8A]" />,
      action: () => {
        onClose();
        onOpenDemoModal();
      },
    },
    {
      id: 'theme',
      label: darkMode ? 'Switch to Light Appearance' : 'Switch to Dark Appearance',
      icon: darkMode ? <Sun className="h-4 w-4 text-[#C18A3A]" /> : <Moon className="h-4 w-4 text-[#6B6B6F]" />,
      action: () => {
        toggleDarkMode();
        onClose();
      },
    },
  ].filter(a => !q || a.label.toLowerCase().includes(q));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-150">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          className="w-full max-w-xl rounded-2xl bg-white/90 dark:bg-[#181818]/95 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden"
        >
          {/* Spotlight Search Input */}
          <div className="flex items-center px-4 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08]">
            <Search className="h-4 w-4 text-[#6B6B6F] mr-3 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search patients, appointments, doctors, IDs (⌘K)..."
              autoFocus
              className="w-full bg-transparent text-sm text-[#1D1D1F] dark:text-white placeholder:text-[#6B6B6F] focus:outline-none font-medium"
            />
            <button
              onClick={onClose}
              className="ml-2 px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] text-[10px] font-semibold text-[#6B6B6F]"
            >
              ESC
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto p-2 space-y-1">
            {/* Appointments Match */}
            {filteredAppointments.length > 0 && (
              <>
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B6B6F]">
                  Appointments & Clinicians
                </div>
                {filteredAppointments.map(app => (
                  <div
                    key={app.id}
                    onClick={() => {
                      if (onSelectAppointment) {
                        onSelectAppointment(app);
                      }
                      onClose();
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-[#1D1D1F] dark:text-white text-xs font-semibold">
                        APT
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                          <span>{app.doctor_name}</span>
                          <span className="text-[10px] text-[#6B6B6F]">({app.department})</span>
                        </div>
                        <div className="text-[10px] text-[#6B6B6F]">
                          ID: #{app.id} · {app.patient?.first_name} {app.patient?.last_name} · {app.appointment_time} · {app.appointment_date}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[#6B6B6F] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </>
            )}

            {/* Patients Match */}
            {filteredPatients.length > 0 && (
              <>
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B6B6F] mt-1">
                  Patients
                </div>
                {filteredPatients.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectPatient(p.id);
                      onClose();
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-semibold text-xs">
                        {p.first_name.charAt(0)}{p.last_name?.charAt(0) || ''}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-[#1D1D1F] dark:text-white">
                          {p.first_name} {p.last_name}
                        </div>
                        <div className="text-[10px] text-[#6B6B6F] font-mono">
                          {p.patient_code} · {p.age} yrs · {p.phone}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[#6B6B6F] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </>
            )}

            {/* Quick Actions */}
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B6B6F] mt-1">
              Actions
            </div>
            {quickActions.map(action => (
              <div
                key={action.id}
                onClick={action.action}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.05]">
                    {action.icon}
                  </div>
                  <span className="text-xs font-medium text-[#1D1D1F] dark:text-white">
                    {action.label}
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#6B6B6F] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          <div className="px-4 py-2 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-[#6B6B6F]">
            <span>Press ESC or click outside to dismiss</span>
            <span className="font-medium">Spotlight Search</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
