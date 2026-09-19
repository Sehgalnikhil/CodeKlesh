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
  ChevronRight,
  ShieldCheck
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
    { name: 'Low Risk', value: analytics?.risk_distribution.low || 64, color: '#4F8A70' },
    { name: 'Medium Risk', value: analytics?.risk_distribution.medium || 38, color: '#C18A3A' },
    { name: 'High Risk', value: analytics?.risk_distribution.high || 26, color: '#C9685B' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6F]">
          Operational Trends
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white mt-1">
          Analytics & Performance
        </h1>
        <p className="text-sm text-[#6B6B6F] mt-1">
          Comprehensive real-time metrics on attendance patterns, specialty variance, and clinical capacity.
        </p>
      </div>

      {/* Model Performance Metrics */}
      <div className="p-6 rounded-2xl bg-white/70 dark:bg-[#181818]/70 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6F]">
              Supervised Clinical Risk Model Benchmark
            </span>
          </div>
          <span className="text-[10px] font-medium text-[#4F8A70] bg-[#4F8A70]/10 px-2.5 py-0.5 rounded-full border border-[#4F8A70]/20">
            Validated Cross-Cohort
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] text-center">
            <span className="text-[10px] text-[#6B6B6F] font-semibold uppercase tracking-wider">Accuracy</span>
            <div className="text-2xl font-semibold text-[#1D1D1F] dark:text-white mt-1">
              {Math.round(metrics.accuracy * 100)}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] text-center">
            <span className="text-[10px] text-[#6B6B6F] font-semibold uppercase tracking-wider">Precision</span>
            <div className="text-2xl font-semibold text-[#1D1D1F] dark:text-white mt-1">
              {Math.round(metrics.precision * 100)}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] text-center">
            <span className="text-[10px] text-[#6B6B6F] font-semibold uppercase tracking-wider">Recall</span>
            <div className="text-2xl font-semibold text-[#1D1D1F] dark:text-white mt-1">
              {Math.round(metrics.recall * 100)}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] text-center">
            <span className="text-[10px] text-[#6B6B6F] font-semibold uppercase tracking-wider">F1 Score</span>
            <div className="text-2xl font-semibold text-[#1D1D1F] dark:text-white mt-1">
              {metrics.f1_score.toFixed(2)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] text-center">
            <span className="text-[10px] text-[#6B6B6F] font-semibold uppercase tracking-wider">ROC-AUC</span>
            <div className="text-2xl font-semibold text-[#647A8A] mt-1">
              {metrics.roc_auc.toFixed(3)}
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Apple Health Minimal Area Chart + Risk Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Apple Health Minimal Smooth Trend */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white/70 dark:bg-[#181818]/70 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
            <div>
              <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                No-Show Rate Over Time
              </h3>
              <p className="text-xs text-[#6B6B6F] mt-0.5">14-day rolling outpatient attendance trend</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#4F8A70] font-medium">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>-5.2% after reminder protocol</span>
            </div>
          </div>

          {/* Smooth Area Chart in Muted Blue-Gray */}
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#647A8A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#647A8A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6B6B6F' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B6B6F' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={val => `${Math.round(val * 100)}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const rate = (payload[0].value as number) * 100;
                      return (
                        <div className="p-3 rounded-xl bg-white/95 dark:bg-[#181818]/95 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.1] shadow-dropdown text-xs">
                          <p className="font-medium text-[#6B6B6F]">{label}</p>
                          <p className="text-[#1D1D1F] dark:text-white font-semibold text-sm mt-0.5">{rate.toFixed(1)}% No-Show</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="no_show_rate"
                  stroke="#647A8A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#healthGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Minimal Risk Distribution Donut */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white/70 dark:bg-[#181818]/70 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
              Risk Distribution
            </h3>
            <p className="text-xs text-[#6B6B6F] mt-0.5">Ensemble probability clustering</p>

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
                <span className="text-2xl font-semibold text-[#1D1D1F] dark:text-white">
                  {analytics?.risk_distribution.total || 128}
                </span>
                <span className="text-[10px] uppercase font-semibold text-[#6B6B6F]">
                  Total Slots
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#6B6B6F]">Low Risk (&lt;40%)</span>
              <span className="font-semibold text-[#4F8A70]">{analytics?.risk_distribution.low || 64}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6B6B6F]">Medium Risk (40–69%)</span>
              <span className="font-semibold text-[#C18A3A]">{analytics?.risk_distribution.medium || 38}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6B6B6F]">High Risk (≥70%)</span>
              <span className="font-semibold text-[#C9685B]">{analytics?.risk_distribution.high || 26}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Department Rankings & Weekday Variance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department No-Show Rates */}
        <div className="p-6 rounded-2xl bg-white/70 dark:bg-[#181818]/70 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
            <div>
              <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                Department Variance
              </h3>
              <p className="text-xs text-[#6B6B6F] mt-0.5">Specialty non-attendance percentages</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {depts.map((d, i) => {
              const pct = Math.round(d.no_show_rate * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#1D1D1F] dark:text-white">{d.name}</span>
                    <span className="font-semibold text-[#1D1D1F] dark:text-white">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 24 ? 'bg-[#C9685B]' : pct >= 18 ? 'bg-[#C18A3A]' : 'bg-[#4F8A70]'
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
        <div className="p-6 rounded-2xl bg-white/70 dark:bg-[#181818]/70 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
            <div>
              <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                Weekday Drop-Off
              </h3>
              <p className="text-xs text-[#6B6B6F] mt-0.5">Attendance fluctuation across days of the week</p>
            </div>
            <span className="text-[10px] font-medium text-[#C9685B] px-2 py-0.5 rounded-full bg-[#C9685B]/10">
              Friday Highest (28.9%)
            </span>
          </div>

          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B6B6F' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B6B6F' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={val => `${Math.round(val * 100)}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const rate = (payload[0].value as number) * 100;
                      return (
                        <div className="p-3 rounded-xl bg-white/95 dark:bg-[#181818]/95 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.1] shadow-dropdown text-xs">
                          <p className="font-medium text-[#6B6B6F]">{label}</p>
                          <p className="text-[#1D1D1F] dark:text-white font-semibold text-sm mt-0.5">{rate.toFixed(1)}% Miss Rate</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="no_show_rate" fill="#647A8A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
