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
  ResponsiveContainer,
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
  ShieldCheck,
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
    { name: 'Low Risk', value: analytics?.risk_distribution.low || 64, color: '#718477' },
    { name: 'Medium Risk', value: analytics?.risk_distribution.medium || 38, color: '#B18A52' },
    { name: 'High Risk', value: analytics?.risk_distribution.high || 26, color: '#B96F63' },
  ];

  const capacitySaved = analytics?.kpis?.capacity_recovered_inr || 42800;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-steel-500">
          Capacity Telemetry Observatory
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-graphite-900 mt-1">
          Analytics Observatory
        </h1>
        <p className="text-xs md:text-sm text-charcoal-700 mt-1 max-w-xl">
          Clean clinical signals, trend lines, and attribution metrics for patient attendance patterns.
        </p>
      </div>

      {/* Large Swiss Observatory Numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-stone-100 border border-stone-200 shadow-spatial-soft">
          <span className="text-[10px] font-mono uppercase tracking-wider text-steel-500 block">
            Appointments Monitored
          </span>
          <span className="text-4xl font-extrabold tracking-tight text-graphite-900 font-mono mt-1 block">
            {analytics?.business_impact?.appointments_analyzed || 1284}
          </span>
          <span className="text-[11px] text-eucalyptus-600 mt-1 block">
            +8.4% volume this week
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-stone-100 border border-stone-200 shadow-spatial-soft">
          <span className="text-[10px] font-mono uppercase tracking-wider text-coral-500 font-bold block">
            High Risk Rate
          </span>
          <span className="text-4xl font-extrabold tracking-tight text-coral-500 font-mono mt-1 block">
            {Math.round(
              ((analytics?.kpis?.high_risk_appointments || 15) /
                Math.max(1, analytics?.kpis?.today_appointments || 30)) *
                100
            )}
            %
          </span>
          <span className="text-[11px] text-steel-500 mt-1 block">
            Flagged for intervention
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-stone-100 border border-stone-200 shadow-spatial-soft">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold block">
            Recovered Slots
          </span>
          <span className="text-4xl font-extrabold tracking-tight text-amber-500 font-mono mt-1 block">
            {analytics?.business_impact?.slots_recovered || 11}
          </span>
          <span className="text-[11px] text-steel-500 mt-1 block">
            Backfilled from waitlist
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-stone-100 border border-stone-200 shadow-spatial-soft">
          <span className="text-[10px] font-mono uppercase tracking-wider text-eucalyptus-500 font-bold block">
            Capacity Protected
          </span>
          <span className="text-4xl font-extrabold tracking-tight text-eucalyptus-500 font-mono mt-1 block">
            ₹{capacitySaved.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-eucalyptus-600 mt-1 block">
            +₹6,400 protected today
          </span>
        </div>
      </div>

      {/* Main Observatory Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Trend Line Chart */}
        <div className="lg:col-span-8 p-8 rounded-3xl bg-stone-100 border border-stone-200 shadow-spatial-card space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-steel-500">
                Primary Trajectory
              </span>
              <h3 className="text-base font-bold text-graphite-900 mt-0.5">
                No-Show Rate Over Time (Post-Intervention)
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-sage-100 text-eucalyptus-600 text-xs font-semibold">
              ↓ 12.5% reduction
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNoShow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#718477" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#718477" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#71808A', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={{ stroke: 'rgba(32, 33, 31, 0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#71808A', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                  axisLine={{ stroke: 'rgba(32, 33, 31, 0.1)' }}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const val = (payload[0].value as number) * 100;
                      return (
                        <div className="p-3 rounded-xl bg-graphite-900 text-porcelain-100 text-xs font-mono shadow-spatial-card">
                          <span>{payload[0].payload.date}: </span>
                          <span className="font-bold text-sage-200">{val.toFixed(1)}% No-show</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="no_show_rate"
                  stroke="#40584B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorNoShow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Risk Distribution Minimal Donut */}
        <div className="lg:col-span-4 p-8 rounded-3xl bg-stone-100 border border-stone-200 shadow-spatial-card flex flex-col justify-between space-y-4">
          <div className="border-b border-stone-200/80 pb-4">
            <span className="text-[10px] font-mono uppercase text-steel-500">
              Active Patient Population
            </span>
            <h3 className="text-base font-bold text-graphite-900 mt-0.5">
              Risk Distribution
            </h3>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
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
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2.5 rounded-xl bg-graphite-900 text-porcelain-100 text-xs font-mono shadow-spatial-card">
                          <span>{payload[0].name}: </span>
                          <span className="font-bold">{payload[0].value} patients</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs">
            {donutData.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-charcoal-700">{d.name}</span>
                </div>
                <span className="font-mono font-bold text-graphite-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Patterns */}
      <div className="p-8 rounded-3xl bg-stone-100 border border-stone-200 shadow-spatial-card space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase text-steel-500">
              Department Patterns
            </span>
            <h3 className="text-base font-bold text-graphite-900 mt-0.5">
              Historical No-Show Rate by Specialty
            </h3>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={depts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#71808A', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(32, 33, 31, 0.1)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#71808A', fontSize: 11, fontFamily: 'monospace' }}
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                axisLine={{ stroke: 'rgba(32, 33, 31, 0.1)' }}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const val = (payload[0].value as number) * 100;
                    return (
                      <div className="p-3 rounded-xl bg-graphite-900 text-porcelain-100 text-xs font-mono shadow-spatial-card">
                        <span>{payload[0].payload.name}: </span>
                        <span className="font-bold text-amber-200">{val.toFixed(1)}% No-show</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="no_show_rate" fill="#B18A52" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
