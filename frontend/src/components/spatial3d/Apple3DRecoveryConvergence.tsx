import React from 'react';
import { motion } from 'framer-motion';
import { AppleVision3DCard } from '../ui/AppleVision3DCard';
import { Sparkles, Check, ArrowRight, Loader2 } from 'lucide-react';

export type RecoveryStage = 'AT_RISK' | 'MATCHING' | 'OFFERED' | 'RECOVERED';

interface Apple3DRecoveryConvergenceProps {
  stage: RecoveryStage;
  appointmentTime: string;
  doctorName: string;
  candidateName: string;
  onFindReplacement: () => void;
  onOfferSlot: () => void;
  onAcceptSlot: () => void;
  isProcessing?: boolean;
}

export const Apple3DRecoveryConvergence: React.FC<Apple3DRecoveryConvergenceProps> = ({
  stage,
  appointmentTime,
  doctorName,
  candidateName,
  onFindReplacement,
  onOfferSlot,
  onAcceptSlot,
  isProcessing = false,
}) => {
  const isRecovered = stage === 'RECOVERED';
  const isOffered = stage === 'OFFERED';
  const isMatching = stage === 'MATCHING';

  return (
    <div className="w-full p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200 shadow-[0_24px_64px_-16px_rgba(15,23,42,0.08)] perspective-1600 space-y-8 select-none">
      {/* Top Header with Status Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-700 font-bold">
            Autonomous Slot Backfill
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
            Spatial Slot Convergence Engine
          </h3>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isRecovered
                ? 'bg-emerald-600'
                : isOffered
                ? 'bg-amber-500 animate-pulse'
                : 'bg-rose-500 animate-pulse'
            }`}
          />
          <span className="font-bold uppercase text-[10px] text-slate-700">
            {isRecovered
              ? 'CAPACITY SECURED & BACKFILLED'
              : isOffered
              ? 'WAITLIST OFFER DISPATCHED'
              : isMatching
              ? 'AI CANDIDATE MATCHED'
              : 'AT-RISK CAPACITY DETECTED'}
          </span>
        </div>
      </div>

      {/* 3D Physical Spatial Convergence Stage */}
      <div className="relative py-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 preserve-3d">
        {/* AT-RISK SLOT TILE (Left Tile) */}
        <motion.div
          animate={{
            x: isRecovered ? 40 : 0,
            scale: isRecovered ? 0.98 : 1,
            rotateY: isRecovered ? 4 : -6,
            z: isRecovered ? 30 : 10,
          }}
          transition={{ type: 'spring', damping: 24, stiffness: 200 }}
          className="w-full md:w-80"
        >
          <AppleVision3DCard
            depth={16}
            translateDepth={40}
            glowColor={isRecovered ? 'rgba(21, 128, 61, 0.15)' : 'rgba(225, 29, 72, 0.15)'}
            className={`p-6 rounded-[24px] bg-white border ${
              isRecovered
                ? 'border-emerald-300 shadow-lg shadow-emerald-500/10'
                : 'border-rose-200 shadow-lg shadow-rose-500/10'
            }`}
          >
            <div style={{ transform: 'translateZ(25px)' }} className="space-y-3">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${
                  isRecovered ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {isRecovered ? 'RECOVERED SLOT' : 'AT-RISK SLOT'}
              </span>
              <div>
                <h4 className="text-2xl font-black font-mono text-slate-900">
                  {appointmentTime}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {doctorName} · Cardiology
                </p>
              </div>

              <div className="pt-2">
                <span
                  className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full ${
                    isRecovered
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {isRecovered ? '✓ 100% CAPACITY SAVED' : '87% NO-SHOW PROBABILITY'}
                </span>
              </div>
            </div>
          </AppleVision3DCard>
        </motion.div>

        {/* Center Convergence Hologram / Connector */}
        <div className="flex flex-col items-center justify-center z-30">
          {isRecovered ? (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 16 }}
              className="px-5 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-black shadow-lg flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>LOCKED & BACKFILLED</span>
            </motion.div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-cyan-600 shadow-sm">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
          )}
        </div>

        {/* WAITLIST CANDIDATE TILE (Right Tile) */}
        <motion.div
          animate={{
            x: isRecovered ? -40 : 0,
            scale: isRecovered ? 0.98 : 1,
            rotateY: isRecovered ? -4 : 6,
            z: isRecovered ? 30 : 10,
          }}
          transition={{ type: 'spring', damping: 24, stiffness: 200 }}
          className="w-full md:w-80"
        >
          <AppleVision3DCard
            depth={16}
            translateDepth={40}
            glowColor={isRecovered ? 'rgba(21, 128, 61, 0.15)' : 'rgba(2, 132, 199, 0.15)'}
            className={`p-6 rounded-[24px] bg-white border ${
              isRecovered
                ? 'border-emerald-300 shadow-lg shadow-emerald-500/10'
                : 'border-slate-200 shadow-md'
            }`}
          >
            <div style={{ transform: 'translateZ(25px)' }} className="space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-700 block">
                {isRecovered ? 'NEW CONFIRMED PATIENT' : 'WAITLIST PRIORITY'}
              </span>
              <div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                  {candidateName}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Available 10:00 - 12:00 Window
                </p>
              </div>

              <div className="pt-2">
                <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                  {isRecovered ? '✓ Appointment Assigned' : 'Match Score 94% · Standby'}
                </span>
              </div>
            </div>
          </AppleVision3DCard>
        </motion.div>
      </div>

      {/* Interactive Controls Bar with Real Backend Wiring */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-900 block">
            {isRecovered
              ? 'Clinic Capacity Preserved: ₹3,500'
              : isOffered
              ? `Waiting for ${candidateName} confirmation...`
              : isMatching
              ? `Matched candidate: ${candidateName}`
              : 'At-risk slot identified for pre-emptive backfill'}
          </span>
          <span className="text-[11px] text-slate-500 block font-mono">
            Zero idle doctor time · Connected to live backend `/slot-recovery/execute`
          </span>
        </div>

        <div className="flex items-center gap-3">
          {stage === 'AT_RISK' && (
            <button
              disabled={isProcessing}
              onClick={onFindReplacement}
              className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Find Match</span>
            </button>
          )}

          {stage === 'MATCHING' && (
            <button
              disabled={isProcessing}
              onClick={onOfferSlot}
              className="px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>Offer Slot to Candidate</span>
            </button>
          )}

          {stage === 'OFFERED' && (
            <button
              disabled={isProcessing}
              onClick={onAcceptSlot}
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
              <span>Simulate Accept & Lock</span>
            </button>
          )}

          {isRecovered && (
            <span className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>RECOVERED & COMMITTED</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
