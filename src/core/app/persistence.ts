import useAppStore from '@core/stores/useAppStore';
import { shallow } from 'zustand/shallow';
import { STORAGE_KEYS } from '@shared/constants/storageKeys';
import { logEvent } from '@use-cases/logger';
import {
  saveRecordsToLocal,
  saveGeneralTasksToLocal,
  saveBookmarksToLocal,
  saveBookmarkCategoriesToLocal,
} from '@use-cases/storage';
import { syncPatientsWithRetry } from '@use-cases/patientSync';
import { removeJson, saveJson } from '@shared/utils/storageJson';
import { safeSetItem } from '@shared/utils/safeStorage';
import { STORAGE_DEFAULTS } from '@shared/constants/storageDefaults';
import { STORAGE_SHADOW_WRITE } from '@shared/config/storageConfig';
import { shadowWriteToIndexedDb } from '@use-cases/storageShadow';

/**
 * Tracking map for patient synchronization.
 * Stores { id: updatedAt } to detect changes since last sync.
 */
const lastSyncedHashes = new Map<string, number>();
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let isSyncStatusUpdate = false;
let persistenceUnsubscribe: (() => void) | null = null;
let persistenceTeardown: (() => void) | null = null;

const updateSyncStatus = (status: 'idle' | 'saving' | 'synced' | 'error', timestamp?: number | null) => {
  const { syncStatus, lastSyncAt, setSyncStatus } = useAppStore.getState();
  const nextLastSyncAt = typeof timestamp === 'number' ? timestamp : status === 'synced' ? Date.now() : null;

  if (syncStatus === status && lastSyncAt === nextLastSyncAt) return;
  if (isSyncStatusUpdate) return;

  isSyncStatusUpdate = true;
  queueMicrotask(() => {
    setSyncStatus(status, nextLastSyncAt);
    isSyncStatusUpdate = false;
  });
};

/**
 * Initializes the persistence layer by subscribing to store changes.
 * Handles debounced saving to LocalStorage and incremental sync to Firebase.
 */
type AppState = ReturnType<typeof useAppStore.getState>;
type PersistedState = Pick<
  AppState,
  | 'records'
  | 'generalTasks'
  | 'bookmarks'
  | 'bookmarkCategories'
  | 'user'
  | 'theme'
  | 'patientTypes'
  | 'securityPinHash'
  | 'securityPinSalt'
  | 'autoLockMinutes'
  | 'highlightPendingPatients'
  | 'compactStats'
  | 'showBookmarkBar'
>;

export const initPersistence = () => {
  if (persistenceTeardown) return persistenceTeardown;

  const unsubscribe = useAppStore.subscribe(
    (state): PersistedState => ({
      records: state.records,
      generalTasks: state.generalTasks,
      bookmarks: state.bookmarks,
      bookmarkCategories: state.bookmarkCategories,
      user: state.user,
      theme: state.theme,
      patientTypes: state.patientTypes,
      securityPinHash: state.securityPinHash,
      securityPinSalt: state.securityPinSalt,
      autoLockMinutes: state.autoLockMinutes,
      highlightPendingPatients: state.highlightPendingPatients,
      compactStats: state.compactStats,
      showBookmarkBar: state.showBookmarkBar,
    }),
    (state: PersistedState) => {
      if (saveTimeout) clearTimeout(saveTimeout);
      updateSyncStatus('saving');

      saveTimeout = setTimeout(async () => {
        const persistUser = () => {
          if (state.user) {
            saveJson(STORAGE_KEYS.USER, state.user);
          } else {
            removeJson(STORAGE_KEYS.USER);
          }
        };

        const persistTheme = () => {
          safeSetItem(STORAGE_KEYS.THEME, state.theme);
        };

        const persistPatientTypes = () => {
          saveJson(STORAGE_KEYS.PATIENT_TYPES, state.patientTypes);
        };

        const persistSecurity = () => {
          saveJson(STORAGE_KEYS.SECURITY, {
            pinHash: state.securityPinHash,
            pinSalt: state.securityPinSalt,
            autoLockMinutes: state.autoLockMinutes ?? STORAGE_DEFAULTS.AUTO_LOCK_MINUTES,
          });
        };

        const persistPreferences = () => {
          saveJson(STORAGE_KEYS.PREFERENCES, {
            highlightPendingPatients: state.highlightPendingPatients ?? STORAGE_DEFAULTS.HIGHLIGHT_PENDING_PATIENTS,
            compactStats: state.compactStats ?? STORAGE_DEFAULTS.COMPACT_STATS,
            showBookmarkBar: state.showBookmarkBar ?? STORAGE_DEFAULTS.SHOW_BOOKMARK_BAR,
          });
        };

        // 1. LocalStorage Persistence
        saveRecordsToLocal(state.records);
        saveGeneralTasksToLocal(state.generalTasks);
        saveBookmarksToLocal(state.bookmarks);
        saveBookmarkCategoriesToLocal(state.bookmarkCategories);

        persistUser();
        persistTheme();
        persistPatientTypes();
        persistSecurity();
        persistPreferences();

        if (STORAGE_SHADOW_WRITE) {
          shadowWriteToIndexedDb({
            records: state.records,
            generalTasks: state.generalTasks,
            bookmarks: state.bookmarks,
            bookmarkCategories: state.bookmarkCategories,
          }).catch((error) => {
            logEvent('warn', 'Persistence', 'IndexedDB shadow write failed', { error });
          });
        }

        // 2. Incremental Firebase Sync
        try {
          if (state.user) {
            const dirtyPatients = state.records.filter((patient: AppState['records'][number]) => {
              const lastSync = lastSyncedHashes.get(patient.id);
              // Decide if it's dirty: never synced or updatedAt is newer
              return lastSync === undefined || (patient.updatedAt || 0) > lastSync;
            });

            if (dirtyPatients.length > 0) {
              logEvent('info', 'Persistence', `Syncing ${dirtyPatients.length} dirty patients to Firebase...`);
              const decorated = dirtyPatients.map((patient: AppState['records'][number]) => ({
                ...patient,
                updatedAt: patient.updatedAt ?? Date.now(),
                syncMeta: {
                  source: 'local' as const,
                  updatedBy: state.user?.email || 'local',
                  updatedAt: patient.updatedAt ?? Date.now(),
                },
              }));

              await syncPatientsWithRetry(decorated);

              // Update tracking map upon success
              dirtyPatients.forEach((p: AppState['records'][number]) => {
                lastSyncedHashes.set(p.id, p.updatedAt || 0);
              });
              logEvent('info', 'Persistence', 'Sincronización incremental exitosa');
            }
          }
          updateSyncStatus('synced', Date.now());
        } catch (error) {
          logEvent('error', 'Persistence', 'Error syncing dirty patients', { error });
          updateSyncStatus('error');
        }
      }, 500);
    },
    { equalityFn: shallow }
  );

  persistenceUnsubscribe = unsubscribe;
  persistenceTeardown = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    if (persistenceUnsubscribe) {
      persistenceUnsubscribe();
      persistenceUnsubscribe = null;
    }
    persistenceTeardown = null;
  };

  return persistenceTeardown;
};

export const resetPersistenceForTests = () => {
  if (persistenceTeardown) {
    persistenceTeardown();
  } else if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
};
