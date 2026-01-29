import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { createPatientSlice, PatientSlice } from '@core/stores/slices/patientSlice';
import { createTaskSlice, TaskSlice } from '@core/stores/slices/taskSlice';
import { createUserSlice, UserSlice } from '@core/stores/slices/userSlice';
import { createSettingsSlice, SettingsSlice, defaultPatientTypes } from '@core/stores/slices/settingsSlice';
import { BookmarksSlice, createBookmarkSlice } from '@core/stores/slices/bookmarkSlice';
import { BookmarkCategory, SecuritySettings, ToastMessage } from '@shared/types';
import { defaultBookmarkCategories, ensureDefaultCategories } from '@domain/bookmarks';
import {
  loadRecordsFromLocal,
  loadGeneralTasksFromLocal,
  loadBookmarksFromLocal,
  loadBookmarkCategoriesFromLocal,
} from '@use-cases/storage';
import { STORAGE_KEYS } from '@shared/constants/storageKeys';

// UI Slice directly here for simplicity
interface UiSlice {
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
  syncStatus: 'idle' | 'saving' | 'synced' | 'error';
  lastSyncAt: number | null;
  setSyncStatus: (status: 'idle' | 'saving' | 'synced' | 'error', timestamp?: number | null) => void;
}

type AppStore = PatientSlice & TaskSlice & UserSlice & SettingsSlice & BookmarksSlice & UiSlice;

// Helper to safely parse types and avoid "null" string issues
const getInitialPatientTypes = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PATIENT_TYPES);
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
const ensureDefaultBookmarkCategories = (categories: BookmarkCategory[]) =>
  ensureDefaultCategories(categories);
const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark';
const storedSecurity = localStorage.getItem(STORAGE_KEYS.SECURITY);
const storedPreferences = localStorage.getItem(STORAGE_KEYS.PREFERENCES);

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
  subscribeWithSelector(
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
        syncStatus: 'idle',
        lastSyncAt: null,
        setSyncStatus: (status, timestamp) => set(() => ({
          syncStatus: status,
          lastSyncAt: typeof timestamp === 'number' ? timestamp : (status === 'synced' ? Date.now() : null),
        })),

        // Overwrite initial state with loaded data if available
        records: initialRecords,
        generalTasks: initialTasks,
        bookmarks: initialBookmarks,
        bookmarkCategories:
          initialBookmarkCategories.length > 0
            ? ensureDefaultBookmarkCategories(initialBookmarkCategories)
            : defaultBookmarkCategories,
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
  )
);

// Initialize Theme Class on load
if (useAppStore.getState().theme === 'dark') {
  document.documentElement.classList.add('dark');
}

// Side effects are now handled by persistenceService.ts

// Subscriber logic removed from here as per Phase 3 Consolidation.

export default useAppStore;
