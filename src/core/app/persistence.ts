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
import { PersistenceManager, PersistenceState } from './PersistenceManager';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let isSyncStatusUpdate = false;
let persistenceUnsubscribe: (() => void) | null = null;
let persistenceTeardown: (() => void) | null = null;
let queuedPersistState: PersistenceState | null = null;
let isPersistLoopRunning = false;

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

const persistenceManager = new PersistenceManager({
  saveToLocal: (state) => {
    saveRecordsToLocal(state.records);
    saveGeneralTasksToLocal(state.generalTasks);
    saveBookmarksToLocal(state.bookmarks);
    saveBookmarkCategoriesToLocal(state.bookmarkCategories);

    if (state.user) {
      saveJson(STORAGE_KEYS.USER, state.user);
    } else {
      removeJson(STORAGE_KEYS.USER);
    }
    safeSetItem(STORAGE_KEYS.THEME, state.theme);
    saveJson(STORAGE_KEYS.PATIENT_TYPES, state.patientTypes);
    saveJson(STORAGE_KEYS.SECURITY, {
      pinHash: state.securityPinHash,
      pinSalt: state.securityPinSalt,
      autoLockMinutes: state.autoLockMinutes ?? STORAGE_DEFAULTS.AUTO_LOCK_MINUTES,
    });
    saveJson(STORAGE_KEYS.PREFERENCES, {
      highlightPendingPatients: state.highlightPendingPatients ?? STORAGE_DEFAULTS.HIGHLIGHT_PENDING_PATIENTS,
      compactStats: state.compactStats ?? STORAGE_DEFAULTS.COMPACT_STATS,
      showBookmarkBar: state.showBookmarkBar ?? STORAGE_DEFAULTS.SHOW_BOOKMARK_BAR,
    });
  },
  shadowWrite: async (state) => {
    if (STORAGE_SHADOW_WRITE) {
      await shadowWriteToIndexedDb({
        records: state.records,
        generalTasks: state.generalTasks,
        bookmarks: state.bookmarks,
        bookmarkCategories: state.bookmarkCategories,
      });
    }
  },
  syncToRemote: async (dirtyPatients, user) => {
    const decorated = dirtyPatients.map((patient) => ({
      ...patient,
      updatedAt: patient.updatedAt ?? Date.now(),
      syncMeta: {
        source: 'local' as const,
        updatedBy: anonymizeIdentifier(user?.email || user?.name || 'local', 'actor'),
        updatedAt: patient.updatedAt ?? Date.now(),
      },
    }));
    await syncPatientsWithRetry(decorated);
  },
  onSyncStatusChange: updateSyncStatus,
  logEvent,
  syncCooldownMs: SYNC_POLICY.syncCooldownMs,
  maxConsecutiveFailures: SYNC_POLICY.maxConsecutiveSyncFailures,
  cooldownLogWindowMs: SYNC_POLICY.cooldownLogWindowMs,
});

const runPersistLoop = () => {
  if (isPersistLoopRunning) return;
  isPersistLoopRunning = true;

  const loop = async () => {
    try {
      while (queuedPersistState) {
        const nextState = queuedPersistState;
        queuedPersistState = null;
        await persistenceManager.persistSnapshot(nextState);
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
    (state): PersistenceState => ({
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
    (state: PersistenceState) => {
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
  persistenceManager.resetState();
};
