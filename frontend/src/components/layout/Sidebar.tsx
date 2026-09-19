import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarCheck,
  AlertTriangle,
  Users,
  ShieldAlert,
  BarChart3,
  Lightbulb,
  Settings,
  Sparkles,
  Zap,
  ChevronRight,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavItem =
  | 'dashboard'
  | 'appointments'
  | 'risk-queue'
  | 'patients'
  | 'predictor'
  | 'recovery'
  | 'analytics'
  | 'models'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  onOpenLanding: () => void;
  onOpenDemoModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenLanding,
  onOpenDemoModal,
}) => {
  const { user, switchRole } = useAuth();

  const navLinks: Array<{ id: NavItem; label: string; icon: React.ReactNode; badge?: string; highlight?: boolean }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'appointments', label: 'Appointments', icon: <CalendarCheck className="h-4 w-4" />, badge: '210' },
    { id: 'risk-queue', label: 'Risk Queue', icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, badge: '17' },
    { id: 'patients', label: 'Patients', icon: <Users className="h-4 w-4" /> },
    { id: 'recovery', label: 'Slot Recovery', icon: <ShieldAlert className="h-4 w-4 text-rose-500" />, badge: '11', highlight: true },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'models', label: 'AI Insights', icon: <Lightbulb className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="p-4 pr-0 h-screen flex flex-col z-20">
      <aside className="w-60 flex-1 apple-floating-panel rounded-[28px] p-3 flex flex-col justify-between overflow-hidden">
        {/* Brand & Logo */}
        <div>
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-3 px-3 py-3 cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_2px_10px_rgba(79,70,229,0.35)] group-hover:scale-105 transition-transform duration-200">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                  SlotSure
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-md">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-[#6E6E73] tracking-tight font-medium">
                Capacity Defense OS
              </p>
            </div>
          </div>

          {/* Glowing Minimal Demo Scenario CTA */}
          <div className="px-1 pt-1 pb-2">
            <button
              onClick={onOpenDemoModal}
              className="w-full py-2 px-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.08] text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center justify-between transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-brand-500 group-hover:rotate-12 transition-transform" />
                <span className="text-[11px] font-bold">2-Minute Demo</span>
              </div>
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold px-1.5 py-0.2 rounded-md bg-brand-500/10">
                Run →
              </span>
            </button>
          </div>

          {/* Navigation Items with Animated Pill Highlight */}
          <nav className="space-y-0.5 mt-2">
            <div className="px-3 pt-1 pb-1.5 text-[9px] font-bold uppercase tracking-wider text-[#6E6E73]">
              Navigation
            </div>
            {navLinks.map(item => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-colors duration-150 ${
                    active
                      ? 'text-[#1D1D1F] dark:text-white'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:hover:text-white'
                  }`}
                >
                  {/* Subtle Translucent Active Pill Background */}
                  {active && (
                    <motion.div
                      layoutId="activeSidebarPill"
                      className="absolute inset-0 rounded-2xl bg-white dark:bg-white/[0.12] shadow-sm border border-black/[0.04] dark:border-white/[0.08]"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-2.5">
                    <span
                      className={`transition-colors ${
                        active ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="tracking-tight">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        item.highlight
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : 'bg-black/[0.04] text-zinc-500 dark:bg-white/[0.08] dark:text-zinc-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: System Status & User Profile */}
        <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] space-y-2">
          {/* Engine Status */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] text-[10px]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[#6E6E73] font-medium">Slot Recovery</span>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active</span>
          </div>

          {/* User Profile Pill */}
          <div className="p-2 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {user?.full_name?.charAt(0) || 'N'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                  {user?.full_name || 'Nikhil'}
                </p>
                <p className="text-[10px] text-[#6E6E73] truncate">
                  {user?.role || 'Doctor'}
                </p>
              </div>
            </div>

            <select
              value={user?.role}
              onChange={e => switchRole(e.target.value as any)}
              className="text-[10px] font-semibold bg-white dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.1] rounded-lg px-1.5 py-0.5 text-zinc-700 dark:text-zinc-300 cursor-pointer focus:outline-none"
            >
              <option value="Doctor">Doc</option>
              <option value="Receptionist">Desk</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>
      </aside>
    </div>
  );
};
