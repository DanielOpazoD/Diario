import useAppStore from '@core/stores/useAppStore';
import { shallow } from 'zustand/shallow';
import { STORAGE_KEYS } from '@shared/constants/storageKeys';
import {
    saveRecordsToLocal,
    saveGeneralTasksToLocal,
    saveBookmarksToLocal,
    saveBookmarkCategoriesToLocal
} from '../storage';
import { syncPatientsToFirebase } from '../firebaseService';

/**
 * Tracking map for patient synchronization.
 * Stores { id: updatedAt } to detect changes since last sync.
 */
const lastSyncedHashes = new Map<string, number>();
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let isSyncStatusUpdate = false;

const updateSyncStatus = (status: 'idle' | 'saving' | 'synced' | 'error', timestamp?: number | null) => {
    const { syncStatus, lastSyncAt, setSyncStatus } = useAppStore.getState();
    const nextLastSyncAt = typeof timestamp === 'number' ? timestamp : (status === 'synced' ? Date.now() : null);

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
type PersistedState = Pick<AppState,
    | 'records'
    | 'generalTasks'
    | 'bookmarks'
    | 'bookmarkCategories'
    | 'user'
    | 'theme'
    | 'patientTypes'
    | 'securityPin'
    | 'autoLockMinutes'
    | 'highlightPendingPatients'
    | 'compactStats'
    | 'showBookmarkBar'
>;

export const initPersistence = () => {
    return useAppStore.subscribe((state): PersistedState => ({
        records: state.records,
        generalTasks: state.generalTasks,
        bookmarks: state.bookmarks,
        bookmarkCategories: state.bookmarkCategories,
        user: state.user,
        theme: state.theme,
        patientTypes: state.patientTypes,
        securityPin: state.securityPin,
        autoLockMinutes: state.autoLockMinutes,
        highlightPendingPatients: state.highlightPendingPatients,
        compactStats: state.compactStats,
        showBookmarkBar: state.showBookmarkBar,
    }), (state: PersistedState) => {
        if (saveTimeout) clearTimeout(saveTimeout);
        updateSyncStatus('saving');

        saveTimeout = setTimeout(async () => {
            // 1. LocalStorage Persistence
            saveRecordsToLocal(state.records);
            saveGeneralTasksToLocal(state.generalTasks);
            saveBookmarksToLocal(state.bookmarks);
            saveBookmarkCategoriesToLocal(state.bookmarkCategories);

            if (state.user) {
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user));
            } else {
                localStorage.removeItem(STORAGE_KEYS.USER);
            }

            localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
            localStorage.setItem(STORAGE_KEYS.PATIENT_TYPES, JSON.stringify(state.patientTypes));

            localStorage.setItem(STORAGE_KEYS.SECURITY, JSON.stringify({
                pin: state.securityPin,
                autoLockMinutes: state.autoLockMinutes,
            }));

            localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify({
                highlightPendingPatients: state.highlightPendingPatients,
                compactStats: state.compactStats,
                showBookmarkBar: state.showBookmarkBar,
            }));

            // 2. Incremental Firebase Sync
            try {
                if (state.user) {
                    const dirtyPatients = state.records.filter((patient: AppState['records'][number]) => {
                        const lastSync = lastSyncedHashes.get(patient.id);
                        // Decide if it's dirty: never synced or updatedAt is newer
                        return lastSync === undefined || (patient.updatedAt || 0) > lastSync;
                    });

                    if (dirtyPatients.length > 0) {
                        console.log(`[Persistence] Syncing ${dirtyPatients.length} dirty patients to Firebase...`);
                        await syncPatientsToFirebase(dirtyPatients);

                        // Update tracking map upon success
                        dirtyPatients.forEach((p: AppState['records'][number]) => {
                            lastSyncedHashes.set(p.id, p.updatedAt || 0);
                        });
                        console.log(' [AutoSave] Sincronización incremental exitosa');
                    }
                }
                updateSyncStatus('synced', Date.now());
            } catch (error) {
                console.error('[Persistence] Error syncing dirty patients:', error);
                updateSyncStatus('error');
            }
        }, 500);
    }, { equalityFn: shallow });
};
