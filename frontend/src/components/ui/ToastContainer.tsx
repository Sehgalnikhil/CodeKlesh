import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();

  const iconMap = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />,
    info: <Info className="h-4 w-4 text-brand-500 flex-shrink-0" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-dropdown"
          >
            <div className="flex items-center gap-2.5">
              {iconMap[toast.type]}
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
