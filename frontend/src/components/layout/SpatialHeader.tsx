import React from 'react';
import {
  Search,
  Sparkles,
  UserPlus,
  PhoneCall,
  PhoneForwarded,
  Bot,
  Compass,
  MessageCircle,
  Zap,
} from 'lucide-react';
import { SpatialTab } from './SpatialNav';

interface SpatialHeaderProps {
  currentTab: SpatialTab;
  onSelectTab: (tab: SpatialTab) => void;
  onOpenStory: () => void;
  onOpenDemoModal?: () => void;
  onOpenSpotlight: () => void;
  onOpenBookAppointment?: () => void;
  onOpenAddPatient: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  onRefreshData?: () => void;
  onOpenVoiceCall?: () => void;
  onOpenOutboundCall?: () => void;
  onOpenWhatsApp?: () => void;
  onOpenRadar?: () => void;
  onOpenAzureDocScanner?: () => void;
}

export const SpatialHeader: React.FC<SpatialHeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenStory,
  onOpenSpotlight,
  onOpenAddPatient,
  onSearch,
  searchQuery,
  onOpenVoiceCall,
  onOpenOutboundCall,
  onOpenWhatsApp,
  onOpenRadar,
  onOpenAzureDocScanner,
}) => {
  const tabLabels: Record<SpatialTab, string> = {
    dashboard: 'Overview Operations',
    appointments: 'Clinical Timeline',
    'risk-queue': 'Risk Queue',
    recovery: 'Slot Recovery Engine',
    patients: 'Patient Directory',
    analytics: 'Capacity Analytics',
    plans: 'Plans & Business Pricing',
  };

  return (
    <header className="sticky top-0 z-30 px-4 sm:px-8 pt-4 pb-1 text-slate-900 pointer-events-none">
      <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between gap-4 rounded-full bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_36px_-10px_rgba(0,0,0,0.08)] pointer-events-auto transition-all">
        {/* Left: Brand & Section Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenStory}
            className="flex items-center gap-2 text-slate-900 font-black text-sm tracking-tight hover:opacity-80 transition-opacity group"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md transition-transform group-hover:scale-105">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <path d="M8 2v4M16 2v4M3 10h18M9 16l2 2 4-4" />
              </svg>
            </div>
            <span className="font-black text-sm tracking-tight text-slate-900 hidden sm:inline">
              SlotSure
            </span>
          </button>

          <span className="text-slate-300">/</span>

          <span className="px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/80 text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wide truncate max-w-[180px] sm:max-w-none shadow-xs">
            {tabLabels[currentTab]}
          </span>
        </div>

        {/* Center: Search & ⌘K Spotlight Trigger */}
        <div className="flex-1 max-w-md hidden md:flex items-center gap-2">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search patients, doctors, departments..."
              className="w-full pl-9 pr-14 py-2 rounded-full text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/60 transition-all shadow-xs"
            />
            <button
              onClick={onOpenSpotlight}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[10px] font-mono bg-white border border-slate-200 text-slate-600 flex items-center gap-0.5 hover:bg-slate-50 transition-colors shadow-xs font-semibold"
            >
              <span>⌘</span>K
            </button>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Voice Triage Desk (Inbound Clinical Voice Reception) */}
          {onOpenVoiceCall && (
            <button
              onClick={onOpenVoiceCall}
              className="px-3 py-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
              title="Open Clinical Voice Triage Desk"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span>Voice Triage</span>
            </button>
          )}

          {/* Outbound Voice Outreach Call */}
          {onOpenOutboundCall && (
            <button
              onClick={onOpenOutboundCall}
              className="px-3 py-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
              title="Trigger Outbound Confirmation Call"
            >
              <PhoneForwarded className="w-3.5 h-3.5 text-slate-600" />
              <span>Outbound Call</span>
            </button>
          )}

          {/* WhatsApp Outpatient Desk */}
          {onOpenWhatsApp && (
            <button
              onClick={onOpenWhatsApp}
              className="px-3.5 py-1.5 rounded-full border border-emerald-600/30 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
              title="Open WhatsApp Outpatient Desk"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-100" />
              <span>WhatsApp Desk</span>
            </button>
          )}

          {/* Patient Live Journey Radar Trigger */}
          {onOpenRadar && (
            <button
              onClick={onOpenRadar}
              className="px-3 py-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
              title="Launch Live Journey Queue Radar"
            >
              <Compass className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Journey Radar</span>
              <span className="sm:hidden">Radar</span>
            </button>
          )}

          {/* Clinical Document & Rx Scanner */}
          {onOpenAzureDocScanner && (
            <button
              onClick={onOpenAzureDocScanner}
              className="px-3 py-1.5 rounded-full border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
              title="Clinical Document & Prescription Scanner"
            >
              <Zap className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden md:inline">Document Scanner</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
