import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
        {toasts.map((toast) => {
          let iconColor = 'text-[#ff4f00]';
          let borderAccent = 'border-l-[#ff4f00]';
          let Icon = Info;

          if (toast.type === 'success') {
            iconColor = 'text-emerald-600 dark:text-emerald-400';
            borderAccent = 'border-l-emerald-600';
            Icon = CheckCircle2;
          } else if (toast.type === 'error') {
            iconColor = 'text-rose-600 dark:text-rose-400';
            borderAccent = 'border-l-rose-600';
            Icon = AlertCircle;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-md bg-white dark:bg-[#1a1a1a] text-[#201515] dark:text-[#fffefb] border border-[rgba(32,21,21,0.12)] dark:border-[rgba(255,255,255,0.14)] border-l-4 ${borderAccent} shadow-md text-sm font-medium transition-all duration-200`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
                <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-50 hover:opacity-100 transition-opacity p-0.5 rounded focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
