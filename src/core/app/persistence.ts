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
import { SYNC_POLICY } from '@shared/config/syncPolicy';
import { anonymizeIdentifier } from '@shared/utils/privacy';
import { shadowWriteToIndexedDb } from '@use-cases/storageShadow';
import { getPatientSyncStateSignature } from '@use-cases/patient/syncState';

/**
 * Tracking map for patient synchronization.
 * Stores { id: syncSignature } to detect changes since last sync.
 */
const lastSyncedHashes = new Map<string, string>();
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let isSyncStatusUpdate = false;
let persistenceUnsubscribe: (() => void) | null = null;
let persistenceTeardown: (() => void) | null = null;
let queuedPersistState: PersistedState | null = null;
let isPersistLoopRunning = false;
let syncFailureCount = 0;
let syncCooldownUntil = 0;
let lastCooldownLogAt = 0;

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

const maybeLogSyncCooldown = (now: number) => {
  const withinWindow = now - lastCooldownLogAt < SYNC_POLICY.cooldownLogWindowMs;
  if (withinWindow) return;
  lastCooldownLogAt = now;
  logEvent('warn', 'Persistence', 'Sync cooldown active after repeated failures', {
    retryAfterMs: Math.max(0, syncCooldownUntil - now),
    failuresBeforeCooldown: SYNC_POLICY.maxConsecutiveSyncFailures,
  });
};

const markSyncSuccess = () => {
  syncFailureCount = 0;
  syncCooldownUntil = 0;
};

const markSyncFailure = (error: unknown) => {
  syncFailureCount += 1;
  if (syncFailureCount >= SYNC_POLICY.maxConsecutiveSyncFailures) {
    syncCooldownUntil = Date.now() + SYNC_POLICY.syncCooldownMs;
    syncFailureCount = 0;
  }
  logEvent('error', 'Persistence', 'Error syncing dirty patients', { error });
};

const persistSnapshot = async (state: PersistedState) => {
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

  if (!state.user) {
    markSyncSuccess();
    updateSyncStatus('synced', Date.now());
    return;
  }

  const now = Date.now();
  if (now < syncCooldownUntil) {
    maybeLogSyncCooldown(now);
    updateSyncStatus('error');
    return;
  }

  const dirtyPatients = state.records.filter((patient: AppState['records'][number]) => {
    const currentSignature = getPatientSyncStateSignature(patient);
    const lastSyncSignature = lastSyncedHashes.get(patient.id);
    return lastSyncSignature === undefined || currentSignature !== lastSyncSignature;
  });

  if (dirtyPatients.length === 0) {
    markSyncSuccess();
    updateSyncStatus('synced', now);
    return;
  }

  try {
    logEvent('info', 'Persistence', `Syncing ${dirtyPatients.length} dirty patients to Firebase...`);
    const decorated = dirtyPatients.map((patient: AppState['records'][number]) => ({
      ...patient,
      updatedAt: patient.updatedAt ?? Date.now(),
      syncMeta: {
        source: 'local' as const,
        updatedBy: anonymizeIdentifier(state.user?.email || state.user?.name || 'local', 'actor'),
        updatedAt: patient.updatedAt ?? Date.now(),
      },
    }));

    await syncPatientsWithRetry(decorated);
    dirtyPatients.forEach((patient: AppState['records'][number]) => {
      lastSyncedHashes.set(patient.id, getPatientSyncStateSignature(patient));
    });
    markSyncSuccess();
    logEvent('info', 'Persistence', 'Sincronizacion incremental exitosa');
    updateSyncStatus('synced', Date.now());
  } catch (error) {
    markSyncFailure(error);
    updateSyncStatus('error');
  }
};

const runPersistLoop = () => {
  if (isPersistLoopRunning) return;
  isPersistLoopRunning = true;

  const loop = async () => {
    try {
      while (queuedPersistState) {
        const nextState = queuedPersistState;
        queuedPersistState = null;
        await persistSnapshot(nextState);
      }
    } finally {
      isPersistLoopRunning = false;
      if (queuedPersistState) runPersistLoop();
    }
  };

  void loop();
};

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

      saveTimeout = setTimeout(() => {
        queuedPersistState = state;
        runPersistLoop();
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
  queuedPersistState = null;
  isPersistLoopRunning = false;
  syncFailureCount = 0;
  syncCooldownUntil = 0;
  lastCooldownLogAt = 0;
  lastSyncedHashes.clear();
};
