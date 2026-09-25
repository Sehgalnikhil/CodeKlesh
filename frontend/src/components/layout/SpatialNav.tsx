import React from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  Users,
  BarChart3,
  PlayCircle,
  CreditCard,
} from 'lucide-react';

export type SpatialTab =
  | 'dashboard'
  | 'appointments'
  | 'risk-queue'
  | 'recovery'
  | 'patients'
  | 'analytics'
  | 'plans';

interface SpatialNavProps {
  currentTab: SpatialTab;
  onSelectTab: (tab: SpatialTab) => void;
  onOpenStory: () => void;
  onOpenDemoModal: () => void;
  riskCount?: number;
  recoveryCount?: number;
}

export const SpatialNav: React.FC<SpatialNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenStory,
  onOpenDemoModal,
  riskCount = 15,
  recoveryCount = 11,
}) => {
  const navItems = [
    {
      id: 'dashboard' as SpatialTab,
      label: 'Overview',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'appointments' as SpatialTab,
      label: 'Appointments',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'risk-queue' as SpatialTab,
      label: 'Risk Queue',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      badge: riskCount > 0 ? String(riskCount) : undefined,
    },
    {
      id: 'recovery' as SpatialTab,
      label: 'Recovery',
      icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
      badge: recoveryCount > 0 ? String(recoveryCount) : undefined,
    },
    {
      id: 'patients' as SpatialTab,
      label: 'Patients',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'analytics' as SpatialTab,
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'plans' as SpatialTab,
      label: 'Plans',
      icon: <CreditCard className="w-4 h-4 text-emerald-500" />,
    },
  ];

  return (
    <>
      {/* DESKTOP: Floating visionOS Glass Rail Dock */}
      <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-center gap-3.5 py-4 px-2.5 rounded-full bg-white/85 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12),inset_0_1px_0_0_rgba(255,255,255,0.9)]">
        {/* Brand Icon / System Overview Launcher */}
        <button
          onClick={onOpenStory}
          title="SlotSure Clinical Overview"
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-950 to-slate-800 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 group relative"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <path d="M8 2v4M16 2v4M3 10h18M9 16l2 2 4-4" />
          </svg>
          <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-bold tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
            System Overview
          </span>
        </button>

        <div className="w-5 h-[1px] bg-slate-200/80" />

        {/* Navigation Item Rail */}
        <nav className="flex flex-col gap-1.5 relative">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={item.label}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all relative group active:scale-95"
              >
                {/* Framer Motion Fluid Active Indicator Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeDesktopDockTab"
                    className="absolute inset-0 rounded-full bg-slate-900 shadow-md"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}

                <span className={`relative z-10 transition-colors ${isActive ? 'text-white font-bold' : 'text-slate-500 group-hover:text-slate-900'}`}>
                  {item.icon}
                </span>

                {/* Badge dot if high-risk or recoverable */}
                {item.badge && !isActive && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse z-20" />
                )}

                {/* Tooltip Hover Glass Pill */}
                <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-slate-900/95 backdrop-blur-md text-white text-[11px] font-semibold tracking-tight whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50 flex items-center gap-1.5 border border-slate-700/50">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="w-5 h-[1px] bg-slate-200/80" />

        {/* Clinical Workflow Simulation Trigger */}
        <button
          onClick={onOpenDemoModal}
          title="Clinical Workflow Simulator"
          className="w-10 h-10 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 flex items-center justify-center transition-all active:scale-95 group relative"
        >
          <PlayCircle className="w-4 h-4 text-slate-500 group-hover:text-slate-900 transition-colors" />
          <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-slate-900 text-white border border-slate-700/50 text-[11px] font-semibold tracking-tight whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
            Workflow Simulator
          </span>
        </button>
      </aside>

      {/* MOBILE: Floating Bottom Navigation Dock */}
      <nav className="fixed bottom-3 left-4 right-4 z-40 lg:hidden flex items-center justify-around py-2 px-3 rounded-full bg-white/90 backdrop-blur-2xl border border-slate-200/90 shadow-[0_12px_36px_-6px_rgba(15,23,42,0.18)]">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className="relative p-2.5 rounded-full flex flex-col items-center justify-center text-xs transition-all active:scale-90"
            >
              {isActive && (
                <motion.div
                  layoutId="activeMobileDockTab"
                  className="absolute inset-0 rounded-full bg-slate-900 shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`relative z-10 ${isActive ? 'text-white' : 'text-slate-500'}`}>
                {item.icon}
              </span>
              {item.badge && !isActive && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
