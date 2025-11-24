
import { Bookmark, BookmarkCategory, PatientRecord, GeneralTask } from '../types';

const STORAGE_KEY = 'medidiario_data_v1';
const GENERAL_TASKS_KEY = 'medidiario_general_tasks_v1';
const BOOKMARKS_KEY = 'medidiario_bookmarks_v1';
const BOOKMARK_CATEGORIES_KEY = 'medidiario_bookmark_categories_v1';

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
