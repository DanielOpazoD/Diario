import { useEffect } from 'react';
import { LogEntry } from '@shared/types';
import { validateEnvironment } from '@services/geminiService';


const useAppStartup = (
  addLog: (level: LogEntry['level'], source: string, message: string, details?: any) => void
) => {
  useEffect(() => {
    validateEnvironment()
      .then(envStatus => addLog('info', 'App', 'Iniciando Aplicación', envStatus))
      .catch(error => addLog('error', 'App', 'No se pudo validar el entorno', { message: String(error) }));
  }, [addLog]);
};

export default useAppStartup;
