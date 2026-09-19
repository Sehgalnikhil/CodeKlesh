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
  Activity,
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
    { id: 'risk-queue', label: 'Risk Queue', icon: <AlertTriangle className="h-4 w-4 text-[#C18A3A]" />, badge: '17' },
    { id: 'patients', label: 'Patients', icon: <Users className="h-4 w-4" /> },
    { id: 'recovery', label: 'Slot Recovery', icon: <ShieldAlert className="h-4 w-4 text-[#C9685B]" />, badge: '11', highlight: true },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'models', label: 'AI Insights', icon: <Lightbulb className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="p-4 pr-0 h-screen flex flex-col z-20">
      <aside className="w-60 flex-1 apple-floating-panel rounded-[24px] p-3.5 flex flex-col justify-between overflow-hidden">
        {/* Brand & Logo */}
        <div>
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 px-2 py-2 cursor-pointer group"
          >
            <div className="h-8 w-8 rounded-xl bg-[#1D1D1F] dark:bg-white flex items-center justify-center text-white dark:text-[#1D1D1F] shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-[#1D1D1F] dark:text-white">
                  SlotSure
                </span>
                <span className="text-[9px] font-semibold px-1.5 py-0.2 bg-black/[0.05] dark:bg-white/[0.08] text-[#1D1D1F] dark:text-white rounded">
                  Clinical
                </span>
              </div>
              <p className="text-[10px] text-[#6B6B6F] tracking-tight">
                Capacity Operations OS
              </p>
            </div>
          </div>

          {/* Demo Scenario CTA */}
          <div className="px-1 pt-1.5 pb-2">
            <button
              onClick={onOpenDemoModal}
              className="w-full py-1.5 px-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.07] border border-black/[0.04] dark:border-white/[0.06] text-xs font-medium text-[#1D1D1F] dark:text-white flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[#647A8A]" />
                <span className="text-[11px]">2-Min Interactive Demo</span>
              </div>
              <span className="text-[10px] text-[#6B6B6F] font-semibold">
                Run →
              </span>
            </button>
          </div>

          {/* Navigation Items with Sliding Selection Pill */}
          <nav className="space-y-1 mt-2">
            <div className="px-3 pt-1 pb-1 text-[9px] font-bold uppercase tracking-wider text-[#6B6B6F]">
              Navigation
            </div>
            {navLinks.map(item => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-150 ${
                    active
                      ? 'text-[#1D1D1F] dark:text-white'
                      : 'text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white'
                  }`}
                >
                  {/* Subtle Translucent Active Pill Background */}
                  {active && (
                    <motion.div
                      layoutId="activeSidebarPill"
                      className="absolute inset-0 rounded-xl bg-white dark:bg-white/[0.12] shadow-sm border border-black/[0.04] dark:border-white/[0.08]"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-2.5">
                    <span
                      className={`transition-colors ${
                        active ? 'text-[#1D1D1F] dark:text-white' : 'text-[#6B6B6F]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`relative z-10 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                        item.highlight
                          ? 'bg-[#C9685B]/10 text-[#C9685B] border border-[#C9685B]/20'
                          : 'bg-black/[0.04] text-[#6B6B6F] dark:bg-white/[0.08]'
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

        {/* Bottom Section: Clinical Role & Connection */}
        <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] space-y-2">
          {/* Recovery Status */}
          <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4F8A70] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4F8A70]"></span>
              </span>
              <span className="text-[#6B6B6F] font-medium">Slot Engine</span>
            </div>
            <span className="text-[#4F8A70] font-semibold">Active</span>
          </div>

          {/* User Profile Pill */}
          <div className="p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F] flex items-center justify-center font-semibold text-xs flex-shrink-0">
                {user?.full_name?.charAt(0) || 'N'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1D1D1F] dark:text-white truncate">
                  {user?.full_name || 'Nikhil Sehgal'}
                </p>
                <p className="text-[10px] text-[#6B6B6F] truncate">
                  {user?.role || 'Clinician'}
                </p>
              </div>
            </div>

            <select
              value={user?.role}
              onChange={e => switchRole(e.target.value as any)}
              className="text-[10px] font-medium bg-white dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.1] rounded px-1.5 py-0.5 text-[#1D1D1F] dark:text-white cursor-pointer focus:outline-none"
            >
              <option value="Doctor">Doctor</option>
              <option value="Receptionist">Desk</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>
      </aside>
    </div>
  );
};
