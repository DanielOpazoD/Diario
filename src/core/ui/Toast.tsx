import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '@shared/types';
import { useShallow } from 'zustand/react/shallow';
import useAppStore from '@core/stores/useAppStore';

const Toast: React.FC = () => {
  const { toasts, removeToast } = useAppStore(useShallow(state => ({
    toasts: state.toasts,
    removeToast: state.removeToast,
  })));

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 2000); // Faster duration (2s)
    return () => clearTimeout(timer);
  }, [onRemove]);

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-green-500" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
  };

  const colors = {
    success: 'bg-white dark:bg-gray-800 border-green-500',
    error: 'bg-white dark:bg-gray-800 border-red-500',
    info: 'bg-white dark:bg-gray-800 border-blue-500',
  };

  return (
    <div className={`pointer-events-auto flex items-center w-64 p-2.5 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 animate-slide-up ${colors[toast.type]}`}>
      <div className="flex-shrink-0 mr-2">{icons[toast.type]}</div>
      <div className="flex-1 text-[11px] font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight leading-tight">{toast.message}</div>
      <button onClick={onRemove} className="ml-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default Toast;
