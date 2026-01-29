import React from 'react';
import { Trash2 } from 'lucide-react';
import { clearAppStorage } from '@services/storage';

interface StorageSettingsProps {
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const StorageSettings: React.FC<StorageSettingsProps> = ({ addToast }) => {
  const handleClearLocal = () => {
    const confirmed = window.confirm(
      'Esto eliminara solo los datos locales de MediDiario en este navegador. ¿Deseas continuar?'
    );
    if (!confirmed) return;

    try {
      clearAppStorage();
      addToast('success', 'Datos locales eliminados. Recargando...');
      window.location.reload();
    } catch (error) {
      addToast('error', 'No se pudo limpiar el almacenamiento local.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Almacenamiento</h3>
      <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-white">Limpiar datos locales</p>
          <p className="text-xs text-gray-500">
            Borra solo las claves locales de MediDiario en este navegador. No afecta datos en Drive.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClearLocal}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Limpiar
        </button>
      </div>
    </div>
  );
};

export default StorageSettings;
