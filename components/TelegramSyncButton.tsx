import React, { useState } from 'react';
import { Cloud } from 'lucide-react';
import Button from './Button';
import useAppStore from '../stores/useAppStore';
import { getActiveAccessToken } from '../services/googleService';
import { syncPatientsFromTelegram } from '../services/telegramSyncService';

const TelegramSyncButton: React.FC = () => {
  const records = useAppStore((state) => state.records);
  const setRecords = useAppStore((state) => state.setRecords);
  const addToast = useAppStore((state) => state.addToast);
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    const token = getActiveAccessToken();
    if (!token) {
      addToast('error', 'Conéctate con Google para sincronizar.');
      return;
    }

    setIsLoading(true);
    try {
      const { mergedRecords, newPatients } = await syncPatientsFromTelegram(token, records);
      setRecords(mergedRecords);
      if (newPatients.length > 0) {
        addToast('success', `${newPatients.length} nuevos pacientes`);
      } else {
        addToast('info', 'Sin pacientes nuevos');
      }
    } catch (error) {
      console.error('Error al sincronizar pacientes desde Telegram', error);
      addToast('error', 'No se pudo sincronizar con Telegram');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      size="sm"
      variant="ai"
      className="from-blue-500 via-indigo-500 to-purple-600"
      icon={!isLoading ? <Cloud className="w-4 h-4" /> : undefined}
      isLoading={isLoading}
    >
      Telegram
    </Button>
  );
};

export default TelegramSyncButton;
