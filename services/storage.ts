
import { PatientRecord, GeneralTask, RecordSnapshot } from '../types';

const STORAGE_KEY = 'medidiario_data_v1';
const GENERAL_TASKS_KEY = 'medidiario_general_tasks_v1';
const RECORD_HISTORY_KEY = 'medidiario_record_versions_v1';
export const SNAPSHOT_LIMIT = 5;

export const saveRecordsToLocal = (records: PatientRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("Error saving to local storage", e);
  }
};

export const loadRecordsFromLocal = (): PatientRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    // Ensure backward compatibility by defaulting arrays
    // This fixes the "Cannot read properties of undefined (reading 'map')" error
    return parsed.map((r: any) => ({
      ...r,
      attachedFiles: Array.isArray(r.attachedFiles) ? r.attachedFiles : [],
      pendingTasks: Array.isArray(r.pendingTasks) ? r.pendingTasks : []
    }));
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

export const saveRecordHistoryToLocal = (history: RecordSnapshot[]) => {
  try {
    localStorage.setItem(RECORD_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Error saving record history', e);
  }
};

export const loadRecordHistoryFromLocal = (): RecordSnapshot[] => {
  try {
    const data = localStorage.getItem(RECORD_HISTORY_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((snapshot: any) => ({
        timestamp: typeof snapshot.timestamp === 'number' ? snapshot.timestamp : Date.now(),
        records: Array.isArray(snapshot.records) ? snapshot.records : [],
      }))
      .filter((snapshot: RecordSnapshot) => Array.isArray(snapshot.records));
  } catch (e) {
    console.error('Error loading record history', e);
    return [];
  }
};

export const pushSnapshotWithLimit = (
  history: RecordSnapshot[],
  snapshot: RecordSnapshot,
  limit: number = SNAPSHOT_LIMIT
): RecordSnapshot[] => {
  const updatedHistory = [...history, snapshot];
  if (updatedHistory.length <= limit) return updatedHistory;
  return updatedHistory.slice(updatedHistory.length - limit);
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
