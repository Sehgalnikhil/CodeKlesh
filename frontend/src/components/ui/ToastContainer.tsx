import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();

  const iconMap = {
    success: <Check className="h-3.5 w-3.5 text-[#4F8A70] flex-shrink-0" />,
    warning: <AlertTriangle className="h-3.5 w-3.5 text-[#C18A3A] flex-shrink-0" />,
    error: <AlertCircle className="h-3.5 w-3.5 text-[#C9685B] flex-shrink-0" />,
    info: <Info className="h-3.5 w-3.5 text-[#647A8A] flex-shrink-0" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none items-end">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', damping: 24, stiffness: 350 }}
            className="pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2 bg-white/90 dark:bg-[#181818]/90 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.12)] text-xs"
          >
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-black/[0.03] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                {iconMap[toast.type]}
              </div>
              <span className="font-medium text-[#1D1D1F] dark:text-white">
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#6B6B6F] hover:text-[#1D1D1F] dark:hover:text-white p-0.5 rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
