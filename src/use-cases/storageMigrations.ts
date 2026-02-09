import { STORAGE_KEYS } from '@shared/constants/storageKeys';
import { loadRecordsFromLocal, saveRecordsToLocal } from '@use-cases/storage';
import { safeGetItem, safeSetItem } from '@shared/utils/safeStorage';

const CURRENT_STORAGE_VERSION = 2;

const parseVersion = (value: string | null) => {
  const version = Number(value);
  return Number.isFinite(version) && version > 0 ? version : 1;
};

export const runStorageMigrations = () => {
  const storedVersion = parseVersion(safeGetItem(STORAGE_KEYS.DATA_VERSION));

  let version = storedVersion;

  if (version < 2) {
    const normalizedRecords = loadRecordsFromLocal();
    saveRecordsToLocal(normalizedRecords);
    version = 2;
  }

  if (version !== storedVersion) {
    safeSetItem(STORAGE_KEYS.DATA_VERSION, String(version));
  }

  if (version < CURRENT_STORAGE_VERSION) {
    safeSetItem(STORAGE_KEYS.DATA_VERSION, String(CURRENT_STORAGE_VERSION));
  }
};
