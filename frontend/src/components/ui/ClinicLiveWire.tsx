import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  X,
  CheckCircle2,
  Send,
  ShieldCheck,
  Clock,
  AlertTriangle,
  PhoneCall,
  UserCheck,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useActivityStream, ActivityEvent } from '../../context/ActivityStreamContext';

export const ClinicLiveWire: React.FC = () => {
  const { events, clearEvents, isConnected, latencyMs } = useActivityStream();
  const [isOpen, setIsOpen] = useState(false);

  const latestEvent = events[0];

  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'CONFIRMATION':
        return <CheckCircle2 className="h-3.5 w-3.5 text-[#4F8A70]" />;
      case 'RECOVERY':
        return <UserCheck className="h-3.5 w-3.5 text-[#4F8A70]" />;
      case 'REMINDER':
        return <Send className="h-3.5 w-3.5 text-[#647A8A]" />;
      case 'CALL_QUEUED':
        return <PhoneCall className="h-3.5 w-3.5 text-[#C18A3A]" />;
      case 'PREDICTION':
        return <AlertTriangle className="h-3.5 w-3.5 text-[#C9685B]" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-[#1D1D1F] dark:text-white" />;
    }
  };

  return (
    <>
      {/* VisionOS Floating Pill in Bottom-Left */}
      <div className="fixed bottom-6 left-6 z-40">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setIsOpen(prev => !prev)}
          className="px-3.5 py-2 rounded-full bg-white/90 dark:bg-[#181818]/90 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.12)] cursor-pointer hover:bg-white dark:hover:bg-[#202020] transition-all flex items-center gap-2.5 text-xs group"
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>

          <span className="font-semibold text-[#1D1D1F] dark:text-white tracking-tight flex items-center gap-1">
            LiveWire
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              {latencyMs}ms
            </span>
          </span>

          <span className="text-[#6B6B6F] max-w-[180px] sm:max-w-[240px] truncate">
            {latestEvent ? latestEvent.title : 'All systems operating'}
          </span>

          <div className="flex items-center gap-1 text-[10px] font-mono bg-black/[0.04] dark:bg-white/[0.08] px-1.5 py-0.5 rounded text-[#6B6B6F]">
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </div>
        </motion.div>
      </div>

      {/* Slide-out Event Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-start p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 26, stiffness: 350 }}
              className="pointer-events-auto w-full max-w-md bg-white/95 dark:bg-[#181818]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
            >
              <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#1D1D1F] dark:text-white" />
                  <h3 className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
                    Clinical Operations LiveWire Feed
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                    ⚡ SSE {latencyMs}ms
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={clearEvents}
                    className="text-[10px] text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white px-2 py-0.5 rounded hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#6B6B6F]">
                    No live events recorded yet.
                  </div>
                ) : (
                  events.map(item => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-start gap-3 text-xs"
                    >
                      <div className="p-1.5 rounded-lg bg-white dark:bg-black/40 shadow-xs mt-0.5">
                        {getEventIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#1D1D1F] dark:text-white truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-[#6B6B6F] flex-shrink-0">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B6B6F] mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
