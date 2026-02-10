import { STORAGE_KEYS } from '@shared/constants/storageKeys';
import {
  loadBookmarkCategoriesFromLocal,
  loadBookmarksFromLocal,
  loadGeneralTasksFromLocal,
  loadRecordsFromLocal,
  saveBookmarkCategoriesToLocal,
  saveBookmarksToLocal,
  saveGeneralTasksToLocal,
  saveRecordsToLocal,
} from '@use-cases/storage';
import { setPatientRecords } from '@use-cases/patient/records';
import { safeGetItem, safeSetItem } from '@shared/utils/safeStorage';

const CURRENT_STORAGE_VERSION = 3;

const parseVersion = (value: string | null) => {
  const version = Number(value);
  return Number.isFinite(version) && version > 0 ? version : 1;
};

export const runStorageMigrations = () => {
  const storedVersion = parseVersion(safeGetItem(STORAGE_KEYS.DATA_VERSION));
  let version = storedVersion;

  if (version < 2) {
    const normalizedRecords = setPatientRecords(loadRecordsFromLocal());
    saveRecordsToLocal(normalizedRecords);
    version = 2;
  }

  if (version < 3) {
    // Force a full read-write cycle so legacy invalid values are normalized and persisted.
    saveRecordsToLocal(setPatientRecords(loadRecordsFromLocal()));
    saveGeneralTasksToLocal(loadGeneralTasksFromLocal());
    saveBookmarksToLocal(loadBookmarksFromLocal());
    saveBookmarkCategoriesToLocal(loadBookmarkCategoriesFromLocal());
    version = 3;
  }

  const targetVersion = version < CURRENT_STORAGE_VERSION ? CURRENT_STORAGE_VERSION : version;
  if (targetVersion !== storedVersion) {
    safeSetItem(STORAGE_KEYS.DATA_VERSION, String(targetVersion));
  }
};
