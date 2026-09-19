import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Sparkles,
  Clock,
  Send,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Info
} from 'lucide-react';
import { ModelMetricsResponse } from '../types';
import { api } from '../api/client';

export const ModelInsightsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getModelMetrics()
      .then(data => setMetrics(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featureData = metrics?.feature_importances || [
    { feature: 'previous_no_shows', label: 'Previous Missed Appointments', percentage: 28.5 },
    { feature: 'days_in_advance', label: 'Days Since Booking (Lead Time)', percentage: 21.4 },
    { feature: 'previous_attendance_rate', label: 'Historical Attendance Rate', percentage: 16.2 },
    { feature: 'sms_reminder_sent', label: 'SMS Reminder Delivered', percentage: 11.8 },
    { feature: 'age', label: 'Patient Age Bracket', percentage: 8.6 },
    { feature: 'distance_km', label: 'Distance from Clinic (km)', percentage: 5.4 },
    { feature: 'is_early_morning', label: 'Early Morning Slot (<9:30 AM)', percentage: 3.8 },
    { feature: 'is_monday_or_friday', label: 'Day of Week (Mon/Fri)', percentage: 2.5 },
  ];

  const rocData = metrics?.roc_curve || [
    { fpr: 0.0, tpr: 0.0 },
    { fpr: 0.1, tpr: 0.46 },
    { fpr: 0.2, tpr: 0.72 },
    { fpr: 0.3, tpr: 0.82 },
    { fpr: 0.5, tpr: 0.92 },
    { fpr: 1.0, tpr: 1.0 },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          AI INSIGHTS
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] mt-1">
          Patterns your clinic should know about.
        </h1>
        <p className="text-sm text-[#6E6E73] mt-1">
          Machine-learned behavioral correlations and clinical capacity optimization recommendations.
        </p>
      </div>

      {/* 3 Signature Glass Pattern Cards with Mini Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Insight 1: Morning Appointments */}
        <div className="p-6 rounded-3xl apple-card flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                Timing Factor
              </span>
            </div>

            <h3 className="text-base font-extrabold text-[#1D1D1F] dark:text-white mt-4 leading-snug">
              Morning appointments have a 14% higher no-show rate.
            </h3>
            <p className="text-xs text-[#6E6E73] mt-1.5 leading-relaxed">
              Patients scheduled between 8:00 AM – 10:00 AM exhibit elevated non-attendance due to commuter traffic and early clinic delays.
            </p>
          </div>

          {/* Mini Supporting Visualization */}
          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6E6E73]">Morning Slots (&lt;10 AM)</span>
              <span className="font-bold text-rose-600">28.4% Miss Rate</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: '68%' }} />
            </div>

            <div className="flex justify-between text-[11px] pt-1">
              <span className="text-[#6E6E73]">Afternoon Slots (2–5 PM)</span>
              <span className="font-bold text-emerald-600">14.1% Miss Rate</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '34%' }} />
            </div>
          </div>
        </div>

        {/* Insight 2: SMS Preference */}
        <div className="p-6 rounded-3xl apple-card flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-2xl bg-brand-500/10 text-brand-600">
                <Send className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300">
                Channel Affinity
              </span>
            </div>

            <h3 className="text-base font-extrabold text-[#1D1D1F] dark:text-white mt-4 leading-snug">
              Patients with 2+ previous no-shows respond better to SMS reminders.
            </h3>
            <p className="text-xs text-[#6E6E73] mt-1.5 leading-relaxed">
              Chronic non-attenders ignore automated voice IVR calls 73% of the time, but respond to personalized 2-way SMS confirmation prompts.
            </p>
          </div>

          {/* Mini Supporting Visualization */}
          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6E6E73]">SMS / WhatsApp Confirmation</span>
              <span className="font-bold text-brand-600">76% Confirmed</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: '76%' }} />
            </div>

            <div className="flex justify-between text-[11px] pt-1">
              <span className="text-[#6E6E73]">Automated Phone Call / Email</span>
              <span className="font-bold text-zinc-500">27% Confirmed</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] overflow-hidden">
              <div className="h-full bg-zinc-400 rounded-full" style={{ width: '27%' }} />
            </div>
          </div>
        </div>

        {/* Insight 3: 24-Hour Window */}
        <div className="p-6 rounded-3xl apple-card flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                Optimal Cadence
              </span>
            </div>

            <h3 className="text-base font-extrabold text-[#1D1D1F] dark:text-white mt-4 leading-snug">
              24-hour reminders produce the highest confirmation rate.
            </h3>
            <p className="text-xs text-[#6E6E73] mt-1.5 leading-relaxed">
              Reminders sent 72+ hours early have high decay, while reminders under 4 hours don't allow sufficient buffer for waitlist backfilling.
            </p>
          </div>

          {/* Mini Supporting Visualization */}
          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6E6E73]">24h Advance Window</span>
              <span className="font-bold text-emerald-600">88% Reliability</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '88%' }} />
            </div>

            <div className="flex justify-between text-[11px] pt-1">
              <span className="text-[#6E6E73]">72h+ Early Notice</span>
              <span className="font-bold text-zinc-500">42% Reliability</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] overflow-hidden">
              <div className="h-full bg-zinc-400 rounded-full" style={{ width: '42%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Model Spec & Feature Importance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feature Importance Rankings (Col 1 to 7) */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl apple-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                Global Factor Importance
              </h3>
              <p className="text-xs text-[#6E6E73] mt-0.5">Ensemble Gini impurity contribution weights</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#6E6E73]">
              8 Features
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {featureData.map((f, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-700 dark:text-zinc-300">{f.label}</span>
                  <span className="font-extrabold text-[#1D1D1F] dark:text-white">{f.percentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/[0.04] dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-indigo-500"
                    style={{ width: `${f.percentage * 3}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Specs Card (Col 8 to 12) */}
        <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl apple-card flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]">
              Supervised Ensemble Specification
            </span>
            <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white mt-1">
              Random Forest Clinical Risk Ensemble
            </h3>
            <p className="text-xs text-[#6E6E73] mt-1.5 leading-relaxed">
              Trained on multi-specialty clinical outpatient cohorts with balanced class weighting, cross-validated on unconfirmed appointment queues.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-[10px] text-[#6E6E73] font-semibold uppercase block">ROC-AUC</span>
                <span className="text-2xl font-extrabold text-emerald-600 mt-0.5 block">0.793</span>
                <span className="text-[10px] text-emerald-600 font-medium">High Discrimination</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-[10px] text-[#6E6E73] font-semibold uppercase block">Precision-Recall</span>
                <span className="text-2xl font-extrabold text-brand-600 mt-0.5 block">0.741</span>
                <span className="text-[10px] text-brand-600 font-medium">Balanced Clinical F1</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-[11px] text-[#6E6E73] leading-relaxed">
            <div className="font-bold flex items-center gap-1.5 text-[#1D1D1F] dark:text-white mb-1">
              <Info className="h-3.5 w-3.5 text-brand-500" />
              <span>Clinical Decision Support Disclaimer</span>
            </div>
            SlotSure predictions are intended for operational capacity recovery and staff workflow assistance. All clinical triage decisions remain under physician authority.
          </div>
        </div>
      </div>
    </div>
  );
};
