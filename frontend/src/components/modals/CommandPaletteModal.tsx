import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CalendarPlus,
  UserPlus,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  User,
  Moon,
  Sun,
  LayoutDashboard,
  Calendar
} from 'lucide-react';
import { Patient } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onSelectPatient: (patientId: number) => void;
  onNavigateTab: (tab: any) => void;
  onOpenBookAppointment: () => void;
  onOpenAddPatient: () => void;
  onOpenDemoModal: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  patients,
  onSelectPatient,
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

  const filteredPatients = query.trim()
    ? patients.filter(p =>
        `${p.first_name} ${p.last_name} ${p.patient_code} ${p.phone}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const quickActions = [
    {
      id: 'book',
      label: 'Book New Appointment',
      icon: <CalendarPlus className="h-4 w-4 text-brand-500" />,
      action: () => {
        onClose();
        onOpenBookAppointment();
      },
    },
    {
      id: 'recovery',
      label: 'Open Slot Recovery Center (11 At-Risk)',
      icon: <ShieldAlert className="h-4 w-4 text-rose-500" />,
      action: () => {
        onClose();
        onNavigateTab('recovery');
      },
    },
    {
      id: 'demo',
      label: 'Run 2-Minute Hackathon Demo Scenario',
      icon: <Sparkles className="h-4 w-4 text-purple-500" />,
      action: () => {
        onClose();
        onOpenDemoModal();
      },
    },
    {
      id: 'risk',
      label: 'View Priority Risk Queue',
      icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
      action: () => {
        onClose();
        onNavigateTab('risk-queue');
      },
    },
    {
      id: 'add_patient',
      label: 'Register New Patient',
      icon: <UserPlus className="h-4 w-4 text-emerald-500" />,
      action: () => {
        onClose();
        onOpenAddPatient();
      },
    },
    {
      id: 'theme',
      label: darkMode ? 'Switch to Light Appearance' : 'Switch to Dark Appearance',
      icon: darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-zinc-400" />,
      action: () => {
        toggleDarkMode();
        onClose();
      },
    },
  ].filter(a => !query.trim() || a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="w-full max-w-xl rounded-3xl bg-white/80 dark:bg-[#161618]/85 backdrop-blur-3xl border border-white/80 dark:border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.25)] overflow-hidden"
        >
          {/* Spotlight Search Input */}
          <div className="flex items-center px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
            <Search className="h-5 w-5 text-zinc-400 mr-3.5 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search patients, actions, or medical departments..."
              autoFocus
              className="w-full bg-transparent text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#6E6E73] focus:outline-none font-medium"
            />
            <button
              onClick={onClose}
              className="ml-2 px-2 py-0.5 rounded-md bg-black/[0.05] dark:bg-white/[0.08] text-[11px] font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              ESC
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {/* Patients Match */}
            {filteredPatients.length > 0 && (
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]">
                Patients
              </div>
            )}
            {filteredPatients.map(p => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectPatient(p.id);
                  onClose();
                }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold text-xs">
                    {p.first_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-brand-600 transition-colors">
                      {p.first_name} {p.last_name}
                    </div>
                    <div className="text-[10px] text-[#6E6E73] font-mono">
                      {p.patient_code} · {p.age}y {p.gender} · {p.phone}
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}

            {/* Quick Actions */}
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]">
              Quick Actions
            </div>
            {quickActions.map(action => (
              <div
                key={action.id}
                onClick={action.action}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05]">
                    {action.icon}
                  </div>
                  <span className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {action.label}
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          <div className="px-4 py-2.5 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-[#6E6E73]">
            <span>Navigate with click or arrow keys</span>
            <span className="font-medium">⌘K Spotlight</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
