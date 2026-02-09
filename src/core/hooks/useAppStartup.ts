import { useEffect } from 'react';
import { LogEntry } from '@shared/types';
import { validateEnvironment } from '@use-cases/ai';
import useAppStore from '@core/stores/useAppStore';
import { STORAGE_KEYS } from '@shared/constants/storageKeys';
import { STORAGE_DEFAULTS } from '@shared/constants/storageDefaults';
import { generateSalt, hashPin } from '@shared/utils/security';
import { loadJson, saveJson } from '@shared/utils/storageJson';


const useAppStartup = (
  addLog: (level: LogEntry['level'], source: string, message: string, details?: any) => void
) => {
  useEffect(() => {
    validateEnvironment()
      .then(envStatus => addLog('info', 'App', 'Iniciando Aplicación', envStatus))
      .catch(error => addLog('error', 'App', 'No se pudo validar el entorno', { message: String(error) }));
  }, [addLog]);

  useEffect(() => {
    const parsed = loadJson<{
      pin?: string | null;
      pinHash?: string | null;
      pinSalt?: string | null;
      autoLockMinutes?: number;
    } | null>(STORAGE_KEYS.SECURITY, null);

    if (!parsed || parsed.pinHash || parsed.pinSalt) {
      return;
    }

    if (typeof parsed.pin !== 'string' || parsed.pin.length < 4) {
      return;
    }

    (async () => {
      try {
        const salt = generateSalt();
        const hash = await hashPin(parsed.pin as string, salt);
        useAppStore.getState().setSecurityPin(hash, salt);
        saveJson(STORAGE_KEYS.SECURITY, {
          pinHash: hash,
          pinSalt: salt,
          autoLockMinutes: typeof parsed.autoLockMinutes === 'number'
            ? parsed.autoLockMinutes
            : STORAGE_DEFAULTS.AUTO_LOCK_MINUTES,
        });
        addLog('info', 'Security', 'PIN migrado a hash seguro');
      } catch (error) {
        addLog('error', 'Security', 'No se pudo migrar el PIN a hash', { message: String(error) });
      }
    })();
  }, [addLog]);
};

export default useAppStartup;
