import { defaultPatientTypes } from '@core/stores/slices/patientTypesSlice';
import { defaultBookmarkCategories, ensureDefaultCategories } from '@domain/bookmarks';
import {
  loadRecordsFromLocal,
  loadGeneralTasksFromLocal,
  loadBookmarksFromLocal,
  loadBookmarkCategoriesFromLocal,
} from '@use-cases/storage';
import { runStorageMigrations } from '@use-cases/storageMigrations';
import { STORAGE_KEYS } from '@shared/constants/storageKeys';
import { safeGetItem } from '@shared/utils/safeStorage';
import { loadJson, loadJsonArray } from '@shared/utils/storageJson';
import { resolveTheme } from '@shared/utils/theme';
import { isNonEmptyArray } from '@shared/utils/arrays';
import type { BookmarkCategory, SecuritySettings, User } from '@shared/types';
import { STORAGE_DEFAULTS } from '@shared/constants/storageDefaults';

 

const getInitialPatientTypes = () => {
  const stored = safeGetItem(STORAGE_KEYS.PATIENT_TYPES);
  const parsed = stored ? loadJsonArray<unknown>(STORAGE_KEYS.PATIENT_TYPES, []) : [];
  return isNonEmptyArray(parsed) ? parsed : defaultPatientTypes;
};

const getInitialSecuritySettings = (): SecuritySettings => {
  const defaults: SecuritySettings = {
    pinHash: null,
    pinSalt: null,
    autoLockMinutes: STORAGE_DEFAULTS.AUTO_LOCK_MINUTES,
  };

  const parsed = loadJson<{
    pinHash?: string | null;
    pinSalt?: string | null;
    autoLockMinutes?: number;
    pin?: string | null;
  } | null>(STORAGE_KEYS.SECURITY, null);

  if (parsed) {
    return {
      pinHash: typeof parsed.pinHash === 'string' ? parsed.pinHash : null,
      pinSalt: typeof parsed.pinSalt === 'string' ? parsed.pinSalt : null,
      autoLockMinutes:
        typeof parsed.autoLockMinutes === 'number' ? parsed.autoLockMinutes : defaults.autoLockMinutes,
    };
  }

  return defaults;
};

const getInitialPreferences = () => {
  const defaults = {
    highlightPendingPatients: STORAGE_DEFAULTS.HIGHLIGHT_PENDING_PATIENTS,
    compactStats: STORAGE_DEFAULTS.COMPACT_STATS,
    showBookmarkBar: STORAGE_DEFAULTS.SHOW_BOOKMARK_BAR,
  };

  const parsed = loadJson<{
    highlightPendingPatients?: boolean;
    compactStats?: boolean;
    showBookmarkBar?: boolean;
  } | null>(STORAGE_KEYS.PREFERENCES, null);

  if (parsed) {
    return {
      highlightPendingPatients:
        typeof parsed.highlightPendingPatients === 'boolean'
          ? parsed.highlightPendingPatients
          : defaults.highlightPendingPatients,
      compactStats:
        typeof parsed.compactStats === 'boolean' ? parsed.compactStats : defaults.compactStats,
      showBookmarkBar:
        typeof parsed.showBookmarkBar === 'boolean' ? parsed.showBookmarkBar : defaults.showBookmarkBar,
    };
  }

  return defaults;
};

const ensureDefaultBookmarkCategories = (categories: BookmarkCategory[]) =>
  ensureDefaultCategories(categories);

export const buildInitialState = () => {
  runStorageMigrations();

  const initialRecords = loadRecordsFromLocal();
  const initialTasks = loadGeneralTasksFromLocal();
  const initialBookmarks = loadBookmarksFromLocal();
  const initialBookmarkCategories = loadBookmarkCategoriesFromLocal();
  const initialSecurity = getInitialSecuritySettings();
  const initialPreferences = getInitialPreferences();
  const storedTheme = safeGetItem(STORAGE_KEYS.THEME);

  return {
    initialRecords,
    initialTasks,
    initialBookmarks,
    initialBookmarkCategories:
      isNonEmptyArray(initialBookmarkCategories)
        ? ensureDefaultBookmarkCategories(initialBookmarkCategories)
        : defaultBookmarkCategories,
    initialUser: loadJson<User | null>(STORAGE_KEYS.USER, null),
    initialTheme: resolveTheme(storedTheme),
    initialPatientTypes: getInitialPatientTypes(),
    initialSecurity,
    initialPreferences,
  };
};
