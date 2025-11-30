import { useEffect } from 'react';
import { LogEntry } from '../types';

const loadGeminiService = () => import('../services/geminiService');
const loadGoogleService = () => import('../services/googleService');

const useAppStartup = (
  addLog: (level: LogEntry['level'], source: string, message: string, details?: any) => void
) => {
  useEffect(() => {
    loadGeminiService()
      .then(({ validateEnvironment }) => validateEnvironment())
      .then(envStatus => addLog('info', 'App', 'Iniciando Aplicación', envStatus))
      .catch(error => addLog('error', 'App', 'No se pudo validar el entorno', { message: String(error) }));
  }, [addLog]);

  useEffect(() => {
    loadGoogleService().then(({ restoreStoredToken }) => restoreStoredToken());
  }, []);
};

export default useAppStartup;
