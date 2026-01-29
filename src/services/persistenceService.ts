import useAppStore from '@core/stores/useAppStore';
import { shallow } from 'zustand/shallow';
import { STORAGE_KEYS } from '@shared/constants/storageKeys';
import {
    saveRecordsToLocal,
    saveGeneralTasksToLocal,
    saveBookmarksToLocal,
    saveBookmarkCategoriesToLocal
} from './storage';
import { syncPatientsToFirebase } from './firebaseService';

/**
 * Tracking map for patient synchronization.
 * Stores { id: updatedAt } to detect changes since last sync.
 */
const lastSyncedHashes = new Map<string, number>();
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Initializes the persistence layer by subscribing to store changes.
 * Handles debounced saving to LocalStorage and incremental sync to Firebase.
 */
export const initPersistence = () => {
    return useAppStore.subscribe((state) => ({
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
    }), (state) => {
        if (saveTimeout) clearTimeout(saveTimeout);
        useAppStore.setState({ syncStatus: 'saving' });

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
                    const dirtyPatients = state.records.filter(patient => {
                        const lastSync = lastSyncedHashes.get(patient.id);
                        // Decide if it's dirty: never synced or updatedAt is newer
                        return lastSync === undefined || (patient.updatedAt || 0) > lastSync;
                    });

                    if (dirtyPatients.length > 0) {
                        console.log(`[Persistence] Syncing ${dirtyPatients.length} dirty patients to Firebase...`);
                        await syncPatientsToFirebase(dirtyPatients);

                        // Update tracking map upon success
                        dirtyPatients.forEach(p => {
                            lastSyncedHashes.set(p.id, p.updatedAt || 0);
                        });
                        console.log(' [AutoSave] Sincronización incremental exitosa');
                    }
                }
                useAppStore.setState({ syncStatus: 'synced', lastSyncAt: Date.now() });
            } catch (error) {
                console.error('[Persistence] Error syncing dirty patients:', error);
                useAppStore.setState({ syncStatus: 'error' });
            }
        }, 500);
    }, { equalityFn: shallow });
};
