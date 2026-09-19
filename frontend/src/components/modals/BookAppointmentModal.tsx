import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarPlus, X, Sparkles } from 'lucide-react';
import { Patient } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentBooked: () => void;
  preselectedPatientId?: number;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  onAppointmentBooked,
  preselectedPatientId,
}) => {
  const { showToast } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    patient_id: preselectedPatientId || 1,
    doctor_name: 'Dr. Sharma',
    department: 'Cardiology',
    appointment_date: nextWeekStr,
    appointment_time: '10:30 AM',
    appointment_type: 'Follow-up',
    booking_date: todayStr,
    sms_reminder_sent: false,
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      api.getPatients().then(data => {
        setPatients(data);
        if (preselectedPatientId) {
          setFormData(prev => ({ ...prev, patient_id: preselectedPatientId }));
        } else if (data.length > 0) {
          setFormData(prev => ({ ...prev, patient_id: data[0].id }));
        }
      }).catch(() => {});
    }
  }, [isOpen, preselectedPatientId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await api.createAppointment(formData);
      const risk = created.prediction?.risk_level || 'EVALUATING';
      const prob = Math.round((created.prediction?.risk_probability || 0) * 100);
      showToast(`✓ Appointment booked for ${created.doctor_name}. AI Risk Score: ${prob}% (${risk})`);
      onAppointmentBooked();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to book appointment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-dropdown max-w-lg w-full overflow-hidden"
        >
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center">
                <CalendarPlus className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Book Clinical Appointment
                </h3>
                <p className="text-xs text-zinc-500">Automated ML risk prediction applied on save</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Patient Select */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Select Patient *
              </label>
              <select
                required
                value={formData.patient_id}
                onChange={e => setFormData({ ...formData, patient_id: parseInt(e.target.value) })}
                className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.patient_code}) — {p.age}y, {p.gender} (Missed: {p.missed_appointments})
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor & Department */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Doctor *
                </label>
                <select
                  value={formData.doctor_name}
                  onChange={e => {
                    const doc = e.target.value;
                    let dept = formData.department;
                    if (doc === 'Dr. Sharma') dept = 'Cardiology';
                    else if (doc === 'Dr. Singh') dept = 'Orthopedics';
                    else if (doc === 'Dr. Patel') dept = 'Neurology';
                    else if (doc === 'Dr. Iyer') dept = 'Pediatrics';
                    else if (doc === 'Dr. Das') dept = 'General Medicine';
                    else if (doc === 'Dr. Reddy') dept = 'Dermatology';
                    setFormData({ ...formData, doctor_name: doc, department: dept });
                  }}
                  className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="Dr. Sharma">Dr. Sharma</option>
                  <option value="Dr. Singh">Dr. Singh</option>
                  <option value="Dr. Patel">Dr. Patel</option>
                  <option value="Dr. Iyer">Dr. Iyer</option>
                  <option value="Dr. Das">Dr. Das</option>
                  <option value="Dr. Reddy">Dr. Reddy</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  readOnly
                  className="w-full text-xs px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Appointment Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.appointment_date}
                  onChange={e => setFormData({ ...formData, appointment_date: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Time Slot *
                </label>
                <select
                  value={formData.appointment_time}
                  onChange={e => setFormData({ ...formData, appointment_time: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="08:30 AM">08:30 AM</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                </select>
              </div>
            </div>

            {/* Appointment Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Appointment Type
                </label>
                <select
                  value={formData.appointment_type}
                  onChange={e => setFormData({ ...formData, appointment_type: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="Routine Follow-up">Routine Follow-up</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Specialist Review">Specialist Review</option>
                  <option value="Diagnostic Review">Diagnostic Review</option>
                  <option value="Preventive Care">Preventive Care</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="sms_send_initial"
                  checked={formData.sms_reminder_sent}
                  onChange={e => setFormData({ ...formData, sms_reminder_sent: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="sms_send_initial" className="text-xs text-zinc-700 dark:text-zinc-300 select-none">
                  Send instant SMS confirmation
                </label>
              </div>
            </div>

            {/* AI Callout note */}
            <div className="p-3 bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50 rounded-xl flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              <Sparkles className="h-4 w-4 text-brand-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">AI Risk Scoring:</span> AttendAI will automatically analyze the patient's past attendance track record, commute distance, and lead time to score no-show risk upon creation.
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2.5 -mx-5 -mb-5 mt-4 bg-zinc-50/50 dark:bg-zinc-900/50">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-soft transition-all"
              >
                {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
