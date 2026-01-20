import useAppStore from '@core/stores/useAppStore';
import { STORAGE_KEYS } from '@shared/constants/storageKeys';
import {
    saveRecordsToLocal,
    saveGeneralTasksToLocal,
    saveBookmarksToLocal,
    saveBookmarkCategoriesToLocal
} from './storage';
import { syncPatientsToFirebase } from './firebaseService';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Initializes the persistence layer by subscribing to store changes.
 * Handles debounced saving to LocalStorage and Firebase.
 */
export const initPersistence = () => {
    return useAppStore.subscribe((state) => {
        if (saveTimeout) clearTimeout(saveTimeout);

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

            // 2. Firebase Sync (Cloud Persistence)
            try {
                await syncPatientsToFirebase(state.records);
            } catch (error) {
                console.error('[Persistence] Error syncing to Firebase:', error);
            }

            console.log(' [AutoSave] Estado sincronizado con LocalStorage y Firebase');
        }, 2000);
    });
};
