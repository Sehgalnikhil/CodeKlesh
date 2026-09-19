import React, { useState } from 'react';
import {
  Search,
  Bell,
  Calendar,
  Moon,
  Sun,
  CalendarPlus,
  UserPlus,
  Command,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onSearch: (q: string) => void;
  onOpenAddPatient: () => void;
  onOpenBookAppointment: () => void;
  onSelectDateFilter: (date: string) => void;
  currentDateFilter: string;
  onOpenSpotlight: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSearch,
  onOpenAddPatient,
  onOpenBookAppointment,
  onSelectDateFilter,
  currentDateFilter,
  onOpenSpotlight,
}) => {
  const { user, darkMode, toggleDarkMode } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'High risk detected', desc: 'Aarav Mehta has 87% no-show probability', time: '10m ago', unread: true },
    { id: 2, title: 'Waitlist Candidate Ready', desc: 'Priya Kapoor matches slot for Dr. Sharma', time: '24m ago', unread: true },
    { id: 3, title: 'Capacity Protected', desc: '₹2,500 slot value saved via Waitlist backfill', time: '1h ago', unread: false },
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="p-4 pb-0 z-30">
      <header className="h-14 px-5 rounded-[24px] apple-floating-panel flex items-center justify-between transition-colors">
        {/* Apple Spotlight Search Bar Trigger */}
        <div
          onClick={onOpenSpotlight}
          className="flex items-center gap-3 w-72 md:w-80 px-3.5 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.09] border border-black/[0.04] dark:border-white/[0.06] cursor-pointer transition-all duration-150 group"
        >
          <Search className="h-3.5 w-3.5 text-zinc-400 group-hover:text-brand-500 transition-colors flex-shrink-0" />
          <span className="text-xs text-[#6E6E73] select-none flex-1 truncate">
            Search or type a command...
          </span>
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-black/[0.06] dark:border-white/[0.08] text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold shadow-xs">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>

        {/* Right Controls: Real-Time Sync, Date, Book Appointment, Appearance, Notifications */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Real-time live status beacon */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="tracking-tight">Live ML Sync</span>
          </div>
          {/* Apple Date Segmented Pill */}
          <div className="hidden md:flex items-center p-0.5 bg-black/[0.03] dark:bg-white/[0.05] rounded-full border border-black/[0.04] dark:border-white/[0.06]">
            <button
              onClick={() => onSelectDateFilter('')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all duration-200 ${
                !currentDateFilter
                  ? 'bg-white dark:bg-zinc-800 text-[#1D1D1F] dark:text-white shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:hover:text-white'
              }`}
            >
              All Dates
            </button>
            <button
              onClick={() => onSelectDateFilter(todayStr)}
              className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all duration-200 ${
                currentDateFilter === todayStr
                  ? 'bg-white dark:bg-zinc-800 text-[#1D1D1F] dark:text-white shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:hover:text-white'
              }`}
            >
              Today · {formattedToday}
            </button>
          </div>

          {/* Quick action: Book Appointment */}
          <button
            onClick={onOpenBookAppointment}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-xs font-semibold text-white rounded-full shadow-[0_2px_10px_rgba(79,70,229,0.3)] active:scale-95 transition-all"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            <span>Book Appt</span>
          </button>

          <div className="h-4 w-[1px] bg-black/[0.08] dark:bg-white/[0.1] mx-0.5" />

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="h-8 w-8 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.05] hover:bg-black/[0.04] dark:hover:bg-white/[0.1] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90"
            title="Toggle Dark Mode"
          >
            {darkMode ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-zinc-600" />
            )}
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(prev => !prev)}
              className="h-8 w-8 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.05] hover:bg-black/[0.04] dark:hover:bg-white/[0.1] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all relative active:scale-90"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white/95 dark:bg-[#161618]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-dropdown p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                    Notifications
                  </span>
                  <span
                    className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold cursor-pointer hover:underline"
                    onClick={() => setShowNotifications(false)}
                  >
                    Mark all read
                  </span>
                </div>
                <div className="mt-2.5 space-y-1.5">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-2xl text-xs transition-colors ${
                        n.unread
                          ? 'bg-brand-50/60 dark:bg-white/[0.04] border border-brand-100/50 dark:border-white/[0.06]'
                          : 'bg-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{n.title}</span>
                        <span className="text-[10px] text-[#6E6E73]">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-[#6E6E73] mt-0.5">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};
