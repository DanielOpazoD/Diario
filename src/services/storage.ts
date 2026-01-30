
import { Bookmark, BookmarkCategory, PatientRecord, GeneralTask, PatientTypeConfig } from '@shared/types';
import { STORAGE_KEYS } from '@shared/constants/storageKeys';

const STORAGE_KEY = STORAGE_KEYS.RECORDS;
const GENERAL_TASKS_KEY = STORAGE_KEYS.TASKS;
const BOOKMARKS_KEY = STORAGE_KEYS.BOOKMARKS;
const BOOKMARK_CATEGORIES_KEY = STORAGE_KEYS.BOOKMARK_CATEGORIES;

export interface BackupFileData {
  patients: PatientRecord[];
  generalTasks: GeneralTask[];
  patientTypes: PatientTypeConfig[];
  bookmarks: Bookmark[];
  bookmarkCategories: BookmarkCategory[];
}

export const saveRecordsToLocal = (records: PatientRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("Error saving to local storage", e);
  }
};

const normalizePatients = (records: any[]): PatientRecord[] => {
  return records.map((r: any) => ({
    ...r,
    driveFolderId: r.driveFolderId ?? null,
    attachedFiles: Array.isArray(r.attachedFiles) ? r.attachedFiles : [],
    pendingTasks: Array.isArray(r.pendingTasks) ? r.pendingTasks : [],
  }));
};

export const loadRecordsFromLocal = (): PatientRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    // Ensure backward compatibility by defaulting arrays
    // This fixes the "Cannot read properties of undefined (reading 'map')" error
    return normalizePatients(parsed);
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

export const saveBookmarksToLocal = (bookmarks: Bookmark[]) => {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch (e) {
    console.error('Error saving bookmarks', e);
  }
};

export const loadBookmarksFromLocal = (): Bookmark[] => {
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((bookmark: any, index: number) => ({
      ...bookmark,
      order: typeof bookmark.order === 'number' ? bookmark.order : index,
      createdAt: typeof bookmark.createdAt === 'number' ? bookmark.createdAt : Date.now(),
    }));
  } catch (e) {
    console.error('Error loading bookmarks', e);
    return [];
  }
};

export const saveBookmarkCategoriesToLocal = (categories: BookmarkCategory[]) => {
  try {
    localStorage.setItem(BOOKMARK_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving bookmark categories', e);
  }
};

export const loadBookmarkCategoriesFromLocal = (): BookmarkCategory[] => {
  try {
    const data = localStorage.getItem(BOOKMARK_CATEGORIES_KEY);
    const parsed = data ? JSON.parse(data) : null;
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.error('Error loading bookmark categories', e);
  }
  return [];
};

export const clearAppStorage = () => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Error clearing storage key', key, e);
    }
  });
};

export const downloadDataAsJson = (backupData: BackupFileData) => {
  const dataStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `medidiario_backup_${new Date().toISOString().split('T')[0]}.json`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseUploadedJson = (file: File): Promise<BackupFileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
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
          const generalTasks = Array.isArray(parsed.generalTasks) ? parsed.generalTasks : [];
          const patientTypes = Array.isArray(parsed.patientTypes) ? parsed.patientTypes : [];
          const bookmarks = Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [];
          const bookmarkCategories = Array.isArray(parsed.bookmarkCategories) ? parsed.bookmarkCategories : [];

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
      // Remove the Data-URI prefix (e.g. "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

export const downloadUrlAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to download file content');
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove "data:mime/type;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const downloadUrlAsArrayBuffer = async (url: string): Promise<ArrayBuffer> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to download file content');
  }
  return response.arrayBuffer();
};
