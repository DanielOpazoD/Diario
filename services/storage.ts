
import { PatientRecord, GeneralTask, EncryptedPatientRecord } from '../types';
import {
  decryptPatientRecord,
  encryptPatientRecord,
  importKeyFromBase64
} from './encryption';

const STORAGE_KEY = 'medidiario_data_v1';
const GENERAL_TASKS_KEY = 'medidiario_general_tasks_v1';
export const ENCRYPTED_STORAGE_KEY = 'medidiario_data_secure_v1';
export const SECURITY_ENABLED_KEY = 'medidiario_security_enabled';
export const SECURITY_SALT_KEY = 'medidiario_security_salt';
export const CACHED_KEY_KEY = 'medidiario_cached_key';

export interface EncryptedBackupPayload {
  encrypted: true;
  salt: string;
  records: EncryptedPatientRecord[];
}

const cleanPatientRecord = (record: any): PatientRecord => ({
  ...record,
  attachedFiles: Array.isArray(record.attachedFiles) ? record.attachedFiles : [],
  pendingTasks: Array.isArray(record.pendingTasks) ? record.pendingTasks : []
});

export const saveRecordsToLocal = async (
  records: PatientRecord[],
  options?: { securityEnabled?: boolean; encryptionKey?: CryptoKey | null; encryptionSalt?: string | null }
) => {
  try {
    if (options?.securityEnabled && options.encryptionKey && options.encryptionSalt) {
      const encryptedRecords = await Promise.all(
        records.map(async (record) => ({
          id: record.id,
          ...(await encryptPatientRecord(record, options.encryptionKey as CryptoKey))
        }))
      );

      const payload: EncryptedBackupPayload = {
        encrypted: true,
        salt: options.encryptionSalt,
        records: encryptedRecords
      };

      localStorage.setItem(SECURITY_ENABLED_KEY, 'true');
      localStorage.setItem(SECURITY_SALT_KEY, options.encryptionSalt);
      localStorage.setItem(ENCRYPTED_STORAGE_KEY, JSON.stringify(payload));
      localStorage.removeItem(STORAGE_KEY);
      return;
    } else if (options?.securityEnabled) {
      console.warn('Security is enabled but no encryption key is available. Skipping save to avoid datos en texto plano.');
      return;
    }

    localStorage.setItem(SECURITY_ENABLED_KEY, 'false');
    localStorage.removeItem(SECURITY_SALT_KEY);
    localStorage.removeItem(ENCRYPTED_STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("Error saving to local storage", e);
  }
};

export const loadRecordsFromLocal = async (key?: CryptoKey | null): Promise<PatientRecord[]> => {
  try {
    const isSecure = localStorage.getItem(SECURITY_ENABLED_KEY) === 'true';

    if (isSecure) {
      const encryptedData = localStorage.getItem(ENCRYPTED_STORAGE_KEY);
      const cachedKey = sessionStorage.getItem(CACHED_KEY_KEY);

      if (!encryptedData) return [];

      const parsed = JSON.parse(encryptedData) as EncryptedBackupPayload;
      if (!parsed.encrypted || !Array.isArray(parsed.records)) return [];

      const workingKey = key
        ? key
        : cachedKey
          ? await importKeyFromBase64(cachedKey)
          : null;

      if (!workingKey) return [];

      const decryptedRecords: PatientRecord[] = [];
      for (const record of parsed.records) {
        try {
          const decrypted = await decryptPatientRecord(record, workingKey);
          decryptedRecords.push(cleanPatientRecord(decrypted));
        } catch (error) {
          console.error('Failed to decrypt record', error);
        }
      }

      return decryptedRecords;
    }

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    return parsed.map(cleanPatientRecord);
  } catch (e) {
    console.error("Error loading from local storage", e);
    return [];
  }
};

export const saveGeneralTasksToLocal = (tasks: GeneralTask[]) => {
  try {
    localStorage.setItem(GENERAL_TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error("Error saving general tasks", e);
  }
};

export const loadGeneralTasksFromLocal = (): GeneralTask[] => {
  try {
    const data = localStorage.getItem(GENERAL_TASKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const downloadDataAsJson = (records: PatientRecord[]) => {
  const dataStr = JSON.stringify(records, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `medidiario_backup_${new Date().toISOString().split('T')[0]}.json`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseUploadedJson = (file: File): Promise<PatientRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result);
        if (parsed?.encrypted && Array.isArray(parsed.records)) {
          reject(new Error('El archivo está cifrado. Desbloquéalo ingresando tu PIN en Configuración.'));
          return;
        }
        if (Array.isArray(parsed)) {
          // Ensure backward compatibility on imported data
          const cleaned = parsed.map((p: any) => ({
             ...p,
             attachedFiles: Array.isArray(p.attachedFiles) ? p.attachedFiles : [],
             pendingTasks: Array.isArray(p.pendingTasks) ? p.pendingTasks : []
          }));
          resolve(cleaned);
        } else {
          reject(new Error("Formato inválido: Se esperaba un arreglo de registros."));
        }
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsText(file);
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data-URI prefix (e.g. "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};
