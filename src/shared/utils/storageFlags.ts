import { STORAGE_KEYS } from '@shared/constants/storageKeys';
import { safeGetItem, safeSetItem } from '@shared/utils/safeStorage';

export const getDebugModeFlag = () => safeGetItem(STORAGE_KEYS.DEBUG_MODE) === 'true';

export const getStoredAppVersion = () => safeGetItem(STORAGE_KEYS.APP_VERSION);

export const setStoredAppVersion = (version: string) => {
  safeSetItem(STORAGE_KEYS.APP_VERSION, version);
};
