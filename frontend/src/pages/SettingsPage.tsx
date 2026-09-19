import React from 'react';
import { Settings, Shield, MessageSquare, Database, Server, CheckCircle2, Stethoscope, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user, switchRole, showToast } = useAuth();

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('✓ Clinic settings saved successfully', 'success');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Clinic Settings & Access Control
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Configure notification dispatch gateways, active clinic credentials, and role permissions.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Clinic Identity */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-soft space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Stethoscope className="h-4 w-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Clinic Organization
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Clinic Name
              </label>
              <input
                type="text"
                defaultValue="Apex Health Specialists"
                className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Outpatient Facility ID
              </label>
              <input
                type="text"
                defaultValue="AHS-MUM-9021"
                className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Communication Gateway Simulation */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Automated Notification Services
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              Simulator Active
            </span>
          </div>

          <p className="text-xs text-zinc-500">
            Reminders dispatched by staff are handled by the AttendAI clinical notification engine. In production, connect Twilio and WhatsApp Business API credentials.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">SMS Gateway</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Mock notification dispatcher active (0ms delay)</p>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">WhatsApp Business</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Interactive 2-way confirmation enabled</p>
            </div>
          </div>
        </div>

        {/* Roles & Permissions */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-soft space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Shield className="h-4 w-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Role & Permissions
            </h3>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Current Active Role:</span>
            <div className="flex items-center gap-2">
              {(['Doctor', 'Receptionist', 'Admin'] as const).map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => switchRole(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    user?.role === role
                      ? 'bg-brand-600 text-white shadow-soft'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-soft transition-all"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
