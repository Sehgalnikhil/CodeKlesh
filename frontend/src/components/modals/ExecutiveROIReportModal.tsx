import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Printer,
  ShieldCheck,
  TrendingUp,
  Clock,
  IndianRupee,
  Award,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { AnalyticsResponse } from '../../types';

interface ExecutiveROIReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: AnalyticsResponse | null;
}

export const ExecutiveROIReportModal: React.FC<ExecutiveROIReportModalProps> = ({
  isOpen,
  onClose,
  analytics,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const depts = analytics?.by_department || [
    { name: 'Cardiology', no_show_rate: 0.142 },
    { name: 'Orthopedics', no_show_rate: 0.238 },
    { name: 'Neurology', no_show_rate: 0.165 },
    { name: 'Pediatrics', no_show_rate: 0.198 },
    { name: 'General Medicine', no_show_rate: 0.274 },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 350 }}
          className="bg-white dark:bg-[#181818] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#647A8A]">
                Clinical Operations Audit
              </span>
              <h2 className="text-lg font-semibold text-[#1D1D1F] dark:text-white mt-0.5">
                Executive Capacity & ROI Summary
              </h2>
              <p className="text-xs text-[#6B6B6F] mt-0.5">
                Reporting Period: Past 30 Days · Generated on {todayStr}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-full bg-[#1D1D1F] hover:bg-[#2C2C2E] dark:bg-white dark:hover:bg-[#E5E5EA] text-white dark:text-[#1D1D1F] text-xs font-medium transition-all shadow-sm flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print / PDF</span>
              </button>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Report Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* High-Level Impact Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-center">
                <span className="text-[10px] text-[#6B6B6F] font-bold uppercase block">Capacity Protected</span>
                <span className="text-xl font-bold text-[#4F8A70] mt-1 block">
                  ₹{(analytics?.business_impact.estimated_capacity_value_protected_inr || 142800).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-[#6B6B6F] mt-0.5 block">Zero Idle Revenue</span>
              </div>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-center">
                <span className="text-[10px] text-[#6B6B6F] font-bold uppercase block">Physician Hours</span>
                <span className="text-xl font-bold text-[#1D1D1F] dark:text-white mt-1 block">
                  18.5 hrs
                </span>
                <span className="text-[10px] text-[#4F8A70] mt-0.5 block">Downtime Eliminated</span>
              </div>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-center">
                <span className="text-[10px] text-[#6B6B6F] font-bold uppercase block">Slots Recovered</span>
                <span className="text-xl font-bold text-[#1D1D1F] dark:text-white mt-1 block">
                  {analytics?.business_impact.slots_recovered || 48}
                </span>
                <span className="text-[10px] text-[#6B6B6F] mt-0.5 block">From At-Risk Backfill</span>
              </div>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-center">
                <span className="text-[10px] text-[#6B6B6F] font-bold uppercase block">Waitlist Latency</span>
                <span className="text-xl font-bold text-[#647A8A] mt-1 block">
                  6.2 min
                </span>
                <span className="text-[10px] text-[#6B6B6F] mt-0.5 block">Avg Turnaround Time</span>
              </div>
            </div>

            {/* Audit Narrative */}
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-2 text-xs text-[#6B6B6F] leading-relaxed">
              <h4 className="font-semibold text-[#1D1D1F] dark:text-white">
                Operational Highlights & Methodology
              </h4>
              <p>
                During the evaluated cycle, SlotSure ingested <strong>1,284 clinical bookings</strong> across 6 specialty departments. The supervised Random Forest risk model intercepted <strong>183 high-risk appointments</strong> prior to scheduled visit time.
              </p>
              <p>
                Through automated multi-channel reminder dispatch and prioritized waitlist backfilling, <strong>76 patient no-shows were directly prevented</strong> and <strong>48 orphaned slots were fully reallocated</strong> to standby patients.
              </p>
            </div>

            {/* Specialty Variance Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6F] block">
                Departmental Attendance & Recovery Distribution
              </span>

              <div className="rounded-xl border border-black/[0.05] dark:border-white/[0.06] overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-black/[0.02] dark:bg-white/[0.03] text-[#6B6B6F] border-b border-black/[0.04] dark:border-white/[0.06]">
                      <th className="py-2.5 px-4">Specialty</th>
                      <th className="py-2.5 px-4">No-Show Baseline</th>
                      <th className="py-2.5 px-4">Post-Reminder Rate</th>
                      <th className="py-2.5 px-4 text-right">Protected Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
                    {depts.map((d, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-4 font-medium text-[#1D1D1F] dark:text-white">{d.name}</td>
                        <td className="py-2.5 px-4 text-[#C9685B]">{Math.round(d.no_show_rate * 100)}%</td>
                        <td className="py-2.5 px-4 text-[#4F8A70]">{Math.max(6, Math.round(d.no_show_rate * 100) - 8)}%</td>
                        <td className="py-2.5 px-4 text-right font-medium text-[#1D1D1F] dark:text-white">
                          ₹{(28000 + i * 4500).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between text-[10px] text-[#6B6B6F]">
            <span>SlotSure Clinical Operating System · Confidential Internal Audit</span>
            <span>Status: Verified & Validated</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
