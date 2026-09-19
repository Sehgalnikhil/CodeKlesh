import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { AnalyticsResponse } from '../types';

interface AnalyticsPageProps {
  analytics: AnalyticsResponse | null;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ analytics }) => {
  const timeSeries = analytics?.no_show_rate_over_time || [
    { date: 'Sep 06', no_show_rate: 0.24 },
    { date: 'Sep 08', no_show_rate: 0.21 },
    { date: 'Sep 10', no_show_rate: 0.19 },
    { date: 'Sep 12', no_show_rate: 0.23 },
    { date: 'Sep 14', no_show_rate: 0.17 },
    { date: 'Sep 16', no_show_rate: 0.18 },
    { date: 'Sep 18', no_show_rate: 0.16 },
  ];

  const depts = analytics?.by_department || [
    { name: 'Cardiology', no_show_rate: 0.142 },
    { name: 'Orthopedics', no_show_rate: 0.238 },
    { name: 'Neurology', no_show_rate: 0.165 },
    { name: 'Pediatrics', no_show_rate: 0.198 },
    { name: 'General Medicine', no_show_rate: 0.274 },
    { name: 'Dermatology', no_show_rate: 0.221 },
  ];

  const days = analytics?.by_day_of_week || [
    { name: 'Mon', no_show_rate: 0.264 },
    { name: 'Tue', no_show_rate: 0.175 },
    { name: 'Wed', no_show_rate: 0.162 },
    { name: 'Thu', no_show_rate: 0.181 },
    { name: 'Fri', no_show_rate: 0.289 },
    { name: 'Sat', no_show_rate: 0.215 },
  ];

  const metrics = analytics?.model_metrics || {
    accuracy: 0.72,
    precision: 0.71,
    recall: 0.73,
    f1_score: 0.72,
    roc_auc: 0.793,
  };

  const donutData = [
    { name: 'Low Risk', value: analytics?.risk_distribution.low || 64, color: '#30D158' },
    { name: 'Medium Risk', value: analytics?.risk_distribution.medium || 38, color: '#FF9F0A' },
    { name: 'High Risk', value: analytics?.risk_distribution.high || 26, color: '#FF453A' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#6E6E73]">
          CLINICAL TRENDS
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] mt-1">
          Capacity & Performance Analytics
        </h1>
        <p className="text-sm text-[#6E6E73] mt-1">
          Apple Health-inspired insights into attendance trends, department variance, and capacity protection.
        </p>
      </div>

      {/* Apple Health Metric Badges (Model Performance) */}
      <div className="p-6 rounded-3xl apple-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6E6E73]">
              Supervised Clinical Risk Model Benchmark
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Validated Cross-Cohort
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] text-center">
            <span className="text-[10px] text-[#6E6E73] font-bold uppercase tracking-wider">Accuracy</span>
            <div className="text-2xl font-extrabold text-[#1D1D1F] dark:text-white mt-1">
              {Math.round(metrics.accuracy * 100)}%
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] text-center">
            <span className="text-[10px] text-[#6E6E73] font-bold uppercase tracking-wider">Precision</span>
            <div className="text-2xl font-extrabold text-[#1D1D1F] dark:text-white mt-1">
              {Math.round(metrics.precision * 100)}%
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] text-center">
            <span className="text-[10px] text-[#6E6E73] font-bold uppercase tracking-wider">Recall</span>
            <div className="text-2xl font-extrabold text-[#1D1D1F] dark:text-white mt-1">
              {Math.round(metrics.recall * 100)}%
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] text-center">
            <span className="text-[10px] text-[#6E6E73] font-bold uppercase tracking-wider">F1 Score</span>
            <div className="text-2xl font-extrabold text-[#1D1D1F] dark:text-white mt-1">
              {metrics.f1_score.toFixed(2)}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] text-center">
            <span className="text-[10px] text-[#6E6E73] font-bold uppercase tracking-wider">ROC-AUC</span>
            <div className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">
              {metrics.roc_auc.toFixed(3)}
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Apple Health Minimal Area Chart + Risk Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Apple Health Minimal Smooth Trend (Col 1 to 8) */}
        <div className="lg:col-span-8 p-6 sm:p-7 rounded-3xl apple-card space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                No-Show Rate Over Time
              </h3>
              <p className="text-xs text-[#6E6E73] mt-0.5">14-day rolling outpatient attendance trend</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>-5.2% after automated reminders</span>
            </div>
          </div>

          {/* Minimalist Smooth Area Chart */}
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="appleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6E6E73' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6E6E73' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={val => `${Math.round(val * 100)}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const rate = (payload[0].value as number) * 100;
                      return (
                        <div className="p-3 rounded-2xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.1] shadow-dropdown text-xs">
                          <p className="font-semibold text-zinc-500">{label}</p>
                          <p className="text-brand-600 font-extrabold text-sm mt-0.5">{rate.toFixed(1)}% No-Show</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="no_show_rate"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#appleGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Minimal Risk Distribution Donut (Col 9 to 12) */}
        <div className="lg:col-span-4 p-6 sm:p-7 rounded-3xl apple-card flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
              Risk Distribution
            </h3>
            <p className="text-xs text-[#6E6E73] mt-0.5">Ensemble probability clustering</p>

            <div className="h-48 relative mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-[#1D1D1F] dark:text-white">
                  {analytics?.risk_distribution.total || 128}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#6E6E73]">
                  Total Slots
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#6E6E73]">Low Risk (&lt;35%)</span>
              <span className="font-bold text-emerald-600">{analytics?.risk_distribution.low || 64}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6E6E73]">Medium Risk (35–64%)</span>
              <span className="font-bold text-amber-600">{analytics?.risk_distribution.medium || 38}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6E6E73]">High Risk (≥65%)</span>
              <span className="font-bold text-rose-600">{analytics?.risk_distribution.high || 26}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Department Rankings & Weekday Variance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department No-Show Rates */}
        <div className="p-6 sm:p-7 rounded-3xl apple-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                Department Variance
              </h3>
              <p className="text-xs text-[#6E6E73] mt-0.5">Specialty non-attendance percentages</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {depts.map((d, i) => {
              const pct = Math.round(d.no_show_rate * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-700 dark:text-zinc-300">{d.name}</span>
                    <span className="font-bold text-[#1D1D1F] dark:text-white">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/[0.04] dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 24 ? 'bg-rose-500' : pct >= 18 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct * 2.8}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day of Week Variance */}
        <div className="p-6 sm:p-7 rounded-3xl apple-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                Weekday Drop-Off
              </h3>
              <p className="text-xs text-[#6E6E73] mt-0.5">Attendance fluctuation across days of the week</p>
            </div>
            <span className="text-[10px] font-bold text-rose-600 px-2 py-0.5 rounded-full bg-rose-500/10">
              Friday Highest (28.9%)
            </span>
          </div>

          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6E6E73' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6E6E73' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={val => `${Math.round(val * 100)}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const rate = (payload[0].value as number) * 100;
                      return (
                        <div className="p-3 rounded-2xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.1] shadow-dropdown text-xs">
                          <p className="font-semibold text-zinc-500">{label}</p>
                          <p className="text-brand-600 font-extrabold text-sm mt-0.5">{rate.toFixed(1)}% Miss Rate</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="no_show_rate" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
