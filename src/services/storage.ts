import { Bookmark, BookmarkCategory, PatientRecord, GeneralTask, BackupFileData } from '@shared/types';
import { STORAGE_KEYS } from '@shared/constants/storageKeys';
import { loadJsonArray, saveJson } from '@shared/utils/storageJson';
import { ensureArray } from '@shared/utils/arrays';
import { emitStructuredLog } from '@services/logger';
import { normalizePatientRecord } from '@domain/patient/normalize';
import {
  BookmarkCategorySchema,
  BookmarkSchema,
  GeneralTaskSchema,
  PatientRecordSchema,
  PatientTypeConfigSchema,
} from '@shared/schemas';
import { safeRemoveItem } from '@shared/utils/safeStorage';

const STORAGE_KEY = STORAGE_KEYS.RECORDS;
const GENERAL_TASKS_KEY = STORAGE_KEYS.TASKS;
const BOOKMARKS_KEY = STORAGE_KEYS.BOOKMARKS;
const BOOKMARK_CATEGORIES_KEY = STORAGE_KEYS.BOOKMARK_CATEGORIES;

const safeSetJson = (key: string, value: unknown, context: string) => {
  const result = saveJson(key, value);
  if (result === false) {
    emitStructuredLog('error', 'Storage', context);
  }
};

export const saveRecordsToLocal = (records: PatientRecord[]) => {
  safeSetJson(STORAGE_KEY, records, 'Error saving records to local storage');
};

const normalizePatients = (records: unknown[]): PatientRecord[] => {
  let invalidCount = 0;
  const normalized = records.flatMap((record, index) => {
    const result = PatientRecordSchema.safeParse(record);
    if (result.success) {
      return [normalizePatientRecord(result.data)];
    }
    invalidCount += 1;
    emitStructuredLog('warn', 'Storage', 'Invalid patient record dropped', { index });
    return [];
  });
  if (invalidCount > 0) {
    emitStructuredLog('warn', 'Storage', 'Some patient records were dropped during normalization', {
      count: invalidCount,
    });
  }
  return normalized;
};

const normalizeGeneralTasks = (tasks: unknown[]): GeneralTask[] => {
  let invalidCount = 0;
  const normalized = tasks.flatMap((task, index) => {
    const candidate = task && typeof task === 'object'
      ? {
          ...task,
          text: typeof (task as any).text === 'string' ? (task as any).text : (task as any).title ?? '',
          isCompleted: typeof (task as any).isCompleted === 'boolean' ? (task as any).isCompleted : false,
          createdAt: typeof (task as any).createdAt === 'number' ? (task as any).createdAt : Date.now(),
          priority: ['low', 'medium', 'high'].includes((task as any).priority)
            ? (task as any).priority
            : 'medium',
        }
      : task;
    const result = GeneralTaskSchema.safeParse(candidate);
    if (result.success) return [result.data];
    invalidCount += 1;
    emitStructuredLog('warn', 'Storage', 'Invalid general task dropped', { index });
    return [];
  });
  if (invalidCount > 0) {
    emitStructuredLog('warn', 'Storage', 'Some general tasks were dropped during normalization', {
      count: invalidCount,
    });
  }
  return normalized;
};

const normalizeBookmarks = (bookmarks: unknown[]): Bookmark[] => {
  let invalidCount = 0;
  const normalized = bookmarks.flatMap((bookmark, index) => {
    const candidate = bookmark && typeof bookmark === 'object'
      ? {
          ...bookmark,
          createdAt: typeof (bookmark as any).createdAt === 'number' ? (bookmark as any).createdAt : Date.now(),
          order: typeof (bookmark as any).order === 'number' ? (bookmark as any).order : index,
        }
      : bookmark;
    const result = BookmarkSchema.safeParse(candidate);
    if (result.success) return [result.data];
    invalidCount += 1;
    emitStructuredLog('warn', 'Storage', 'Invalid bookmark dropped', { index });
    return [];
  });
  if (invalidCount > 0) {
    emitStructuredLog('warn', 'Storage', 'Some bookmarks were dropped during normalization', {
      count: invalidCount,
    });
  }
  return normalized;
};

const normalizeBookmarkCategories = (categories: unknown[]): BookmarkCategory[] => {
  let invalidCount = 0;
  const normalized = categories.flatMap((category, index) => {
    const result = BookmarkCategorySchema.safeParse(category);
    if (result.success) return [result.data];
    invalidCount += 1;
    emitStructuredLog('warn', 'Storage', 'Invalid bookmark category dropped', { index });
    return [];
  });
  if (invalidCount > 0) {
    emitStructuredLog('warn', 'Storage', 'Some bookmark categories were dropped during normalization', {
      count: invalidCount,
    });
  }
  return normalized;
};

const normalizePatientTypes = (types: unknown[]) => {
  let invalidCount = 0;
  const normalized = types.flatMap((type, index) => {
    const result = PatientTypeConfigSchema.safeParse(type);
    if (result.success) return [result.data];
    invalidCount += 1;
    emitStructuredLog('warn', 'Storage', 'Invalid patient type dropped', { index });
    return [];
  });
  if (invalidCount > 0) {
    emitStructuredLog('warn', 'Storage', 'Some patient types were dropped during normalization', {
      count: invalidCount,
    });
  }
  return normalized;
};

export const loadRecordsFromLocal = (): PatientRecord[] => {
  const parsed = loadJsonArray<unknown>(STORAGE_KEY, []);

  // Ensure backward compatibility by defaulting arrays
  // This fixes the "Cannot read properties of undefined (reading 'map')" error
  return normalizePatients(parsed);
};

export const saveGeneralTasksToLocal = (tasks: GeneralTask[]) => {
  safeSetJson(GENERAL_TASKS_KEY, tasks, 'Error saving general tasks');
};

export const loadGeneralTasksFromLocal = (): GeneralTask[] => {
  const parsed = ensureArray<unknown>(loadJsonArray<unknown>(GENERAL_TASKS_KEY, []), []);
  return normalizeGeneralTasks(parsed);
};

export const saveBookmarksToLocal = (bookmarks: Bookmark[]) => {
  safeSetJson(BOOKMARKS_KEY, bookmarks, 'Error saving bookmarks');
};

export const loadBookmarksFromLocal = (): Bookmark[] => {
  const parsed = loadJsonArray<unknown>(BOOKMARKS_KEY, []);
  return normalizeBookmarks(parsed);
};

export const saveBookmarkCategoriesToLocal = (categories: BookmarkCategory[]) => {
  safeSetJson(BOOKMARK_CATEGORIES_KEY, categories, 'Error saving bookmark categories');
};

export const loadBookmarkCategoriesFromLocal = (): BookmarkCategory[] => {
  const parsed = loadJsonArray<unknown>(BOOKMARK_CATEGORIES_KEY, []);
  return normalizeBookmarkCategories(parsed);
};

export const clearAppStorage = () => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    const result = safeRemoveItem(key);
    if (result === false) {
      emitStructuredLog('error', 'Storage', 'Error clearing storage key', { key });
    }
  });
};

export const downloadDataAsJson = (backupData: BackupFileData) => {
  const dataStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  try {
    link.download = `medidiario_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
  } finally {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const parseUploadedJson = (file: File): Promise<BackupFileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    if (!reader) {
      reject(new Error("No se pudo leer el archivo en este dispositivo."));
      return;
    }
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed)) {
          resolve({
            patients: normalizePatients(parsed),
            generalTasks: [],
            patientTypes: [],
            bookmarks: [],
            bookmarkCategories: [],
          });
          return;
        }

        if (parsed && typeof parsed === 'object') {
          const patients = Array.isArray(parsed.patients) ? normalizePatients(parsed.patients) : [];
          const generalTasks = Array.isArray(parsed.generalTasks) ? normalizeGeneralTasks(parsed.generalTasks) : [];
          const patientTypes = Array.isArray(parsed.patientTypes) ? normalizePatientTypes(parsed.patientTypes) : [];
          const bookmarks = Array.isArray(parsed.bookmarks) ? normalizeBookmarks(parsed.bookmarks) : [];
          const bookmarkCategories = Array.isArray(parsed.bookmarkCategories)
            ? normalizeBookmarkCategories(parsed.bookmarkCategories)
            : [];

          resolve({
            patients,
            generalTasks,
            patientTypes,
            bookmarks,
            bookmarkCategories,
          });
          return;
        }

        reject(new Error("Formato inválido: Se esperaba un arreglo de registros o un objeto de respaldo."));
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
      const parts = result.split(',');
      const base64 = parts.length > 1 ? parts[1] : '';
      if (!base64) {
        reject(new Error('Archivo inválido: no se pudo extraer base64.'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

const isFirebaseStorageUrl = (url: string) => url.includes('firebasestorage.googleapis.com');

const fetchViaProxy = async (url: string) => {
  const response = await fetch(`/.netlify/functions/storage-proxy?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    throw new Error('Failed to download file content');
  }
  return await response.json() as { base64: string; mimeType: string };
};

export const downloadUrlAsBase64 = async (url: string): Promise<string> => {
  let blob: Blob;
  if (isFirebaseStorageUrl(url)) {
    const proxyPayload = await fetchViaProxy(url);
    const binary = atob(proxyPayload.base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    blob = new Blob([bytes], { type: proxyPayload.mimeType });
  } else {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to download file content');
    }
    blob = await response.blob();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const parts = result.split(',');
      const base64 = parts.length > 1 ? parts[1] : '';
      if (!base64) {
        reject(new Error('Contenido inválido: no se pudo extraer base64.'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const downloadUrlAsArrayBuffer = async (url: string): Promise<ArrayBuffer> => {
  if (isFirebaseStorageUrl(url)) {
    const proxyPayload = await fetchViaProxy(url);
    const binary = atob(proxyPayload.base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return bytes.buffer;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to download file content');
  }
  return response.arrayBuffer();
};
