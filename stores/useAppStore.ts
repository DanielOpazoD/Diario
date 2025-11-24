import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createPatientSlice, PatientSlice } from './slices/patientSlice';
import { createTaskSlice, TaskSlice } from './slices/taskSlice';
import { createUserSlice, UserSlice } from './slices/userSlice';
import { createSettingsSlice, SettingsSlice, defaultPatientTypes } from './slices/settingsSlice';
import { BookmarksSlice, createBookmarkSlice, defaultBookmarkCategories } from './slices/bookmarkSlice';
import { SecuritySettings, ToastMessage } from '../types';
import {
  loadRecordsFromLocal,
  loadGeneralTasksFromLocal,
  loadBookmarksFromLocal,
  loadBookmarkCategoriesFromLocal,
  saveRecordsToLocal,
  saveGeneralTasksToLocal,
  saveBookmarksToLocal,
  saveBookmarkCategoriesToLocal
} from '../services/storage';

// UI Slice directly here for simplicity
interface UiSlice {
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
}

type AppStore = PatientSlice & TaskSlice & UserSlice & SettingsSlice & BookmarksSlice & UiSlice;

// Helper to safely parse types and avoid "null" string issues
const getInitialPatientTypes = () => {
  try {
    const stored = localStorage.getItem('medidiario_patient_types');
    if (stored && stored !== "undefined" && stored !== "null") {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error parsing stored patient types", e);
  }
  return defaultPatientTypes;
};

// Load initial state
const initialRecords = loadRecordsFromLocal();
const initialTasks = loadGeneralTasksFromLocal();
const initialBookmarks = loadBookmarksFromLocal();
const initialBookmarkCategories = loadBookmarkCategoriesFromLocal();
const storedUser = localStorage.getItem('medidiario_user');
const storedTheme = localStorage.getItem('medidiario_theme') as 'light' | 'dark';
const storedSecurity = localStorage.getItem('medidiario_security');
const storedPreferences = localStorage.getItem('medidiario_preferences');

const getInitialSecuritySettings = (): SecuritySettings => {
  const defaults: SecuritySettings = {
    pin: null,
    autoLockMinutes: 5,
  };

  if (storedSecurity) {
    try {
      const parsed = JSON.parse(storedSecurity);
      return {
        pin: typeof parsed.pin === 'string' ? parsed.pin : null,
        autoLockMinutes: typeof parsed.autoLockMinutes === 'number' ? parsed.autoLockMinutes : defaults.autoLockMinutes,
      };
    } catch (e) {
      console.error('Error parsing stored security settings', e);
    }
  }

  return defaults;
};

const initialSecurity = getInitialSecuritySettings();

const getInitialPreferences = () => {
  const defaults = {
    highlightPendingPatients: true,
    compactStats: true,
    showBookmarkBar: false,
  };

  if (storedPreferences) {
    try {
      const parsed = JSON.parse(storedPreferences);
      return {
        highlightPendingPatients: typeof parsed.highlightPendingPatients === 'boolean' ? parsed.highlightPendingPatients : defaults.highlightPendingPatients,
        compactStats: typeof parsed.compactStats === 'boolean' ? parsed.compactStats : defaults.compactStats,
        showBookmarkBar: typeof parsed.showBookmarkBar === 'boolean' ? parsed.showBookmarkBar : defaults.showBookmarkBar,
      };
    } catch (e) {
      console.error('Error parsing stored preferences', e);
    }
  }

  return defaults;
};

const initialPreferences = getInitialPreferences();

const useAppStore = create<AppStore>()(
  devtools(
    (set, get, api) => ({
      ...createPatientSlice(set, get, api),
      ...createTaskSlice(set, get, api),
      ...createUserSlice(set, get, api),
      ...createSettingsSlice(set, get, api),
      ...createBookmarkSlice(set, get, api),
      
      // UI Slice Implementation
      toasts: [],
      addToast: (type, message) => set((state) => ({
        toasts: [...state.toasts, { id: crypto.randomUUID(), type, message }]
      })),
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      })),

      // Overwrite initial state with loaded data if available
      records: initialRecords,
      generalTasks: initialTasks,
      bookmarks: initialBookmarks,
      bookmarkCategories: initialBookmarkCategories.length > 0 ? initialBookmarkCategories : defaultBookmarkCategories,
      user: storedUser ? JSON.parse(storedUser) : null,
      theme: storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
      patientTypes: getInitialPatientTypes(),
      securityPin: initialSecurity.pin,
      autoLockMinutes: initialSecurity.autoLockMinutes,
      highlightPendingPatients: initialPreferences.highlightPendingPatients,
      compactStats: initialPreferences.compactStats,
      showBookmarkBar: initialPreferences.showBookmarkBar,
    }),
    { name: 'MediDiarioStore' }
  )
);

// Initialize Theme Class on load
if (useAppStore.getState().theme === 'dark') {
  document.documentElement.classList.add('dark');
}

// --- Auto-Save Middleware (Subscriber) ---
let saveTimeout: any;

useAppStore.subscribe((state) => {
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    saveRecordsToLocal(state.records);
    saveGeneralTasksToLocal(state.generalTasks);
    saveBookmarksToLocal(state.bookmarks);
    saveBookmarkCategoriesToLocal(state.bookmarkCategories);
    
    if (state.user) {
      localStorage.setItem('medidiario_user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('medidiario_user');
    }
    localStorage.setItem('medidiario_theme', state.theme);
    localStorage.setItem('medidiario_patient_types', JSON.stringify(state.patientTypes));
    localStorage.setItem('medidiario_security', JSON.stringify({
      pin: state.securityPin,
      autoLockMinutes: state.autoLockMinutes,
    }));
    localStorage.setItem('medidiario_preferences', JSON.stringify({
      highlightPendingPatients: state.highlightPendingPatients,
      compactStats: state.compactStats,
      showBookmarkBar: state.showBookmarkBar,
    }));

    console.log(' [AutoSave] Estado sincronizado con LocalStorage');
  }, 2000);
});

export default useAppStore;