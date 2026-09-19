import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  Sparkles,
  ArrowRight,
  Send,
  CalendarPlus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
  User,
  Clock,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { CircularGauge } from '../components/ui/CircularGauge';
import { Prediction, FactorDetail } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface RiskPredictorPageProps {
  onBookDirectly: (predictionData: any) => void;
}

export const RiskPredictorPage: React.FC<RiskPredictorPageProps> = ({ onBookDirectly }) => {
  const { showToast } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<Prediction | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    // Patient Information
    age: 42,
    gender: 'Male',
    previous_appointments: 5,
    previous_no_shows: 2,
    previous_attendance_rate: 0.60,

    // Appointment Information
    appointment_date: nextWeekStr,
    appointment_time: '10:30 AM',
    department: 'Cardiology',
    doctor_name: 'Dr. Sharma',
    appointment_type: 'Specialist Review',
    booking_date: todayStr,
    days_in_advance: 10,

    // Communication
    sms_reminder_sent: false,
    email_reminder_sent: false,
    previous_reminder_response: 'Ignored',

    // Other Factors
    distance_km: 14.5,
    insurance_type: 'Commercial',
    chronic_condition: false,
  });

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate real ML inference delay for smooth animation
      await new Promise(r => setTimeout(r, 650));
      const res = await api.predictRisk(formData);
      setPredictionResult(res);
      showToast('ML Risk prediction evaluated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Prediction failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRecommendation = () => {
    showToast('✓ Recommendation applied: Automated multi-channel reminder scheduled', 'success');
  };

  const handleReset = () => {
    setPredictionResult(null);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <BrainCircuit className="h-4 w-4" />
          <span>Predictive Decision Engine</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Predict Appointment Risk
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Estimate the likelihood that an appointment will be missed before confirming the schedule.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!predictionResult ? (
          /* Multi-Section Form */
          <motion.form
            key="predict-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handlePredict}
            className="space-y-6"
          >
            {/* Section 1: Patient Information */}
            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-soft space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <User className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Patient Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="110"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 30 })}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Previous Missed Appointments
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.previous_no_shows}
                    onChange={e => setFormData({ ...formData, previous_no_shows: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Appointment Information */}
            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-soft space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <Clock className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Appointment Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={formData.appointment_date}
                    onChange={e => setFormData({ ...formData, appointment_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Appointment Time
                  </label>
                  <select
                    value={formData.appointment_time}
                    onChange={e => setFormData({ ...formData, appointment_time: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="08:30 AM">08:30 AM (Early Morning)</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:30 AM">10:30 AM (Standard)</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="04:30 PM">04:30 PM (Late Afternoon)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Days Between Booking & Visit
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={formData.days_in_advance}
                    onChange={e => setFormData({ ...formData, days_in_advance: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Dermatology">Dermatology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Doctor
                  </label>
                  <input
                    type="text"
                    value={formData.doctor_name}
                    onChange={e => setFormData({ ...formData, doctor_name: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Appointment Type
                  </label>
                  <select
                    value={formData.appointment_type}
                    onChange={e => setFormData({ ...formData, appointment_type: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="Specialist Review">Specialist Review</option>
                    <option value="Routine Follow-up">Routine Follow-up</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Diagnostic Review">Diagnostic Review</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Communication & Other Factors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-soft space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <MessageSquare className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Communication
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sms_pred_chk"
                      checked={formData.sms_reminder_sent}
                      onChange={e => setFormData({ ...formData, sms_reminder_sent: e.target.checked })}
                      className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                    />
                    <label htmlFor="sms_pred_chk" className="text-xs text-zinc-700 dark:text-zinc-300 select-none">
                      SMS reminder sent to patient
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Previous Reminder Response
                    </label>
                    <select
                      value={formData.previous_reminder_response}
                      onChange={e => setFormData({ ...formData, previous_reminder_response: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="Ignored">Ignored / No Reply</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Rescheduled">Rescheduled</option>
                      <option value="None">No History</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-soft space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <Sliders className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Other Factors
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Distance from Clinic (km)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.distance_km}
                        onChange={e => setFormData({ ...formData, distance_km: parseFloat(e.target.value) || 5 })}
                        className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Insurance
                      </label>
                      <select
                        value={formData.insurance_type}
                        onChange={e => setFormData({ ...formData, insurance_type: e.target.value })}
                        className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                      >
                        <option value="Commercial">Commercial</option>
                        <option value="Private">Private</option>
                        <option value="Public">Public</option>
                        <option value="Self-Pay">Self-Pay</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="chronic_pred_chk"
                      checked={formData.chronic_condition}
                      onChange={e => setFormData({ ...formData, chronic_condition: e.target.checked })}
                      className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                    />
                    <label htmlFor="chronic_pred_chk" className="text-xs text-zinc-700 dark:text-zinc-300 select-none">
                      Chronic condition indicator
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Predict Button */}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-soft transition-all flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Predicting Risk...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="h-4 w-4" />
                    <span>Predict Risk</span>
                  </>
                )}
              </button>
            </div>
          </motion.form>
        ) : (
          /* Prediction Result Screen (Section 9) */
          <motion.div
            key="predict-result"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-soft space-y-8"
          >
            <div className="text-center max-w-md mx-auto space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Missed Appointment Probability
              </h2>
              {/* Animated circular gauge */}
              <div className="py-4">
                <CircularGauge
                  probability={predictionResult.risk_probability}
                  riskLevel={predictionResult.risk_level}
                  size={200}
                />
              </div>
            </div>

            {/* Risk Breakdown */}
            <div className="max-w-2xl mx-auto space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Risk Breakdown
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {predictionResult.top_factors.map((f, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {f.label}
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded ${
                        Math.abs(f.percentage) >= 20
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {Math.abs(f.percentage) >= 20 ? 'High impact' : 'Medium impact'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Intervention */}
            <div className="max-w-2xl mx-auto p-5 bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-900/60 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                  Recommended Intervention
                </span>
              </div>

              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {predictionResult.recommended_action}
              </p>

              <div className="p-3 bg-white/90 dark:bg-zinc-900/90 rounded-xl border border-brand-100 dark:border-brand-900/40 flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                  Estimated probability after intervention:
                </span>
                <div className="flex items-center gap-2 font-bold">
                  <span className="text-rose-600 dark:text-rose-400">
                    {Math.round(predictionResult.risk_probability * 100)}%
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {Math.round(predictionResult.estimated_impact_prob * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Run Another Prediction</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleApplyRecommendation}
                  className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold shadow-soft transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Apply Recommendation</span>
                </button>

                <button
                  onClick={() => onBookDirectly(formData)}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-soft transition-all flex items-center gap-1.5"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  <span>Create Appointment</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
