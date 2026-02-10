import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { clearStorage } from '@use-cases/storage';
import type { PatientRecord } from '@shared/types';
import { repairPatientAttachmentsGlobally } from '@use-cases/patient/repairAttachments';

interface StorageSettingsProps {
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  records: PatientRecord[];
  setRecords: (records: PatientRecord[]) => void;
}

const StorageSettings: React.FC<StorageSettingsProps> = ({ addToast, records, setRecords }) => {
  const [isRepairing, setIsRepairing] = useState(false);
  const [lastRepairSummary, setLastRepairSummary] = useState<string>('');

  const handleClearLocal = () => {
    const confirmed = window.confirm(
      'Esto eliminara solo los datos locales de MediDiario en este navegador. ¿Deseas continuar?'
    );
    if (!confirmed) return;

    try {
      clearStorage();
      addToast('success', 'Datos locales eliminados. Recargando...');
      window.location.reload();
    } catch (error) {
      addToast('error', 'No se pudo limpiar el almacenamiento local.');
    }
  };

  const handleRepairAttachments = async () => {
    if (isRepairing) return;
    setIsRepairing(true);
    setLastRepairSummary('');

    try {
      const result = await repairPatientAttachmentsGlobally(records);
      if (result.repairedPatients > 0) {
        setRecords(result.records);
      }

      const summary = [
        `Carpetas escaneadas: ${result.scannedPatientFolders}`,
        `Archivos detectados: ${result.scannedFiles}`,
        `Pacientes reparados: ${result.repairedPatients}`,
        `Adjuntos recuperados: ${result.recoveredFiles}`,
        `Asociados por RUT: ${result.linkedByRutPatients}`,
      ].join(' | ');

      setLastRepairSummary(summary);

      if (result.repairedPatients > 0) {
        addToast('success', `Reparacion completa: ${result.repairedPatients} paciente(s) actualizados.`);
      } else {
        addToast('info', 'No se detectaron adjuntos pendientes de reparar.');
      }
    } catch (_error) {
      addToast('error', 'No se pudo ejecutar la reparacion global de adjuntos.');
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Almacenamiento</h3>
      <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 mb-4">
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

      <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-white">Reparar adjuntos Firebase</p>
          <p className="text-xs text-gray-500">
            Reescanea las carpetas de Firebase Storage y reconstruye adjuntos faltantes por paciente.
          </p>
          {lastRepairSummary && (
            <p className="text-[11px] text-gray-500 mt-2">{lastRepairSummary}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleRepairAttachments}
          disabled={isRepairing}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
        >
          {isRepairing ? 'Reparando...' : 'Reparar'}
        </button>
      </div>
    </div>
  );
};

export default StorageSettings;
