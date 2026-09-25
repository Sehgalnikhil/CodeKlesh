import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Printer,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Filter,
  Calendar,
  Clock,
  User,
  Stethoscope,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { Appointment } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ReceptionistRunSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  selectedDate?: string;
}

export const ReceptionistRunSheetModal: React.FC<ReceptionistRunSheetModalProps> = ({
  isOpen,
  onClose,
  appointments,
  selectedDate = new Date().toISOString().split('T')[0],
}) => {
  const { showToast } = useAuth();
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [checkedInMap, setCheckedInMap] = useState<Record<number, boolean>>({});

  // Keyboard shortcut to close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const uniqueDoctors = Array.from(new Set(appointments.map(a => a.doctor_name))).filter(Boolean);

  const filteredAppointments = appointments
    .filter(a => selectedDoctor === 'all' || a.doctor_name === selectedDoctor)
    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

  const toggleCheckIn = (id: number) => {
    setCheckedInMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = filteredAppointments.map((a, idx) => {
      const pName = a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : `Patient #${a.patient_id}`;
      const pPhone = a.patient?.phone || '+91 98765 43210';
      const risk = Math.round((a.prediction?.risk_probability || 0) * 100);
      return `${idx + 1}. [${a.appointment_time}] ${pName} (${pPhone}) -> ${a.doctor_name} | Risk: ${risk}% | Status: ${a.confirmation_status}`;
    }).join('\n');

    navigator.clipboard.writeText(`SlotSure Clinical Run-Sheet - ${selectedDate}\n\n${text}`);
    showToast('Run-sheet copied to clipboard', 'info');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md">
        {/* Printable styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-runsheet, #printable-runsheet * {
              visibility: visible;
            }
            #printable-runsheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 20px;
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
          }
        ` }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="bg-stone-50 border border-stone-200/80 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header (hidden in print) */}
          <div className="px-6 py-4 border-b border-stone-200/70 bg-white flex items-center justify-between no-print">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800 shadow-sm">
                <Printer className="w-5 h-5 text-stone-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-stone-900">Receptionist Morning Run-Sheet</h2>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-stone-100 text-stone-700 rounded-full border border-stone-200">
                    Front-Desk Operations
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Printable daily clinical triage sheet with risk predictions, phone check-ins, and notes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 flex items-center gap-1.5 transition-colors"
                title="Copy plain text summary"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar (hidden in print) */}
          <div className="px-6 py-2.5 bg-stone-100/70 border-b border-stone-200/70 flex items-center justify-between gap-4 no-print text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-500 font-medium">Filter Clinician:</span>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 font-medium focus:outline-none focus:ring-1 focus:ring-stone-400"
              >
                <option value="all">All Doctors ({appointments.length} patients)</option>
                {uniqueDoctors.map(doc => (
                  <option key={doc} value={doc}>
                    {doc} ({appointments.filter(a => a.doctor_name === doc).length})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-stone-500 text-[11px] flex items-center gap-3">
              <span>Total: <strong>{filteredAppointments.length}</strong></span>
              <span>•</span>
              <span>Checked-in: <strong className="text-emerald-700">{Object.values(checkedInMap).filter(Boolean).length}</strong></span>
              <span>•</span>
              <span>Date: <strong>{selectedDate}</strong></span>
            </div>
          </div>

          {/* Printable Sheet Content */}
          <div id="printable-runsheet" className="p-6 overflow-y-auto flex-1 text-xs text-stone-800 bg-white">
            {/* Print-only title */}
            <div className="mb-4 pb-3 border-b-2 border-stone-900 hidden print:block">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-stone-900">SlotSure Daily Clinical Run-Sheet</h1>
                  <p className="text-xs text-stone-600">Front Desk Triage & In-Person Check-In Roster</p>
                </div>
                <div className="text-right text-xs text-stone-600">
                  <p className="font-semibold text-stone-900">Date: {selectedDate}</p>
                  <p>Clinician: {selectedDoctor === 'all' ? 'All Clinicians' : selectedDoctor}</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-100/80 border-b border-stone-200 text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center">Arrived</th>
                    <th className="py-2.5 px-3 w-20">Time</th>
                    <th className="py-2.5 px-4">Patient Name & Contact</th>
                    <th className="py-2.5 px-3">Clinician / Dept</th>
                    <th className="py-2.5 px-3 text-center">No-Show Risk</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Pre-Intake Notes / Token</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/70 text-xs">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">
                        No appointments found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => {
                      const isChecked = !!checkedInMap[apt.id];
                      const riskPercent = Math.round((apt.prediction?.risk_probability || 0) * 100);
                      const isHighRisk = riskPercent >= 70;
                      const isMedRisk = riskPercent >= 35 && riskPercent < 70;
                      const pName = apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : `Patient #${apt.patient_id}`;
                      const pPhone = apt.patient?.phone || '+91 98765 43210';

                      return (
                        <tr
                          key={apt.id}
                          className={`hover:bg-stone-50/80 transition-colors ${
                            isChecked ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => toggleCheckIn(apt.id)}
                              className="text-stone-400 hover:text-stone-700 transition-colors"
                              title="Mark Arrived"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600 inline" />
                              ) : (
                                <Square className="w-4 h-4 text-stone-300 hover:text-stone-400 inline" />
                              )}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-stone-900 whitespace-nowrap">
                            {apt.appointment_time}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-stone-900">{pName}</div>
                            <div className="text-[11px] text-stone-500 font-mono">{pPhone}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-stone-800">{apt.doctor_name}</div>
                            <div className="text-[11px] text-stone-500">{apt.department}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                isHighRisk
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : isMedRisk
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {riskPercent}% {isHighRisk ? 'High' : isMedRisk ? 'Med' : 'Safe'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="capitalize text-[11px] font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                              {apt.confirmation_status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-stone-600 max-w-[200px] truncate">
                            {apt.notes ? (
                              <span className="text-stone-800 font-medium" title={apt.notes}>
                                {apt.notes}
                              </span>
                            ) : (
                              <span className="text-stone-400 italic">Routine consultation</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Run-sheet Footer for Print */}
            <div className="mt-6 pt-4 border-t border-stone-300 flex justify-between items-center text-[11px] text-stone-500">
              <span>SlotSure Clinical Operating Intelligence System • Generated on {new Date().toLocaleTimeString()}</span>
              <span>Page 1 of 1 • Official Hospital Run-Sheet</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
