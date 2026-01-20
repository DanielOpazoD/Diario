import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '@shared/types';
import useAppStore from '@core/stores/useAppStore';

const Toast: React.FC = () => {
  const toasts = useAppStore(state => state.toasts);
  const removeToast = useAppStore(state => state.removeToast);

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
    }, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const colors = {
    success: 'bg-white dark:bg-gray-800 border-green-500',
    error: 'bg-white dark:bg-gray-800 border-red-500',
    info: 'bg-white dark:bg-gray-800 border-blue-500',
  };

  return (
    <div className={`pointer-events-auto flex items-center w-80 p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 animate-slide-up ${colors[toast.type]}`}>
      <div className="flex-shrink-0 mr-3">{icons[toast.type]}</div>
      <div className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{toast.message}</div>
      <button onClick={onRemove} className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
