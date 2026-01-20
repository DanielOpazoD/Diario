import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDangerous = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-700 animate-fade-in">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-full ${isDangerous ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-blue-100 text-blue-600'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            {message}
          </p>

          <div className="flex justify-end space-x-3">
            <Button variant="ghost" onClick={onClose}>
              {cancelText}
            </Button>
            <Button variant={isDangerous ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;