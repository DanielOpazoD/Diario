import type { StorageMaintenancePort } from '@data/ports/storagePorts';
import { clearAppStorage, downloadDataAsJson, parseUploadedJson } from '@services/storage';

export const storageAdapter: StorageMaintenancePort = {
  clearStorage: clearAppStorage,
  downloadBackupAsJson: downloadDataAsJson,
  parseBackupFile: parseUploadedJson,
};
