import { localStorageAdapter } from '@data/adapters/localStorageAdapter';
import { indexedDbAdapter } from '@data/adapters/indexedDbAdapter';
import type { AsyncStoragePort, LocalStoragePort } from '@data/ports/storagePorts';
import { STORAGE_MODE } from '@shared/config/storageConfig';

export const selectSyncStorage = (): LocalStoragePort => {
  return localStorageAdapter;
};

export const selectAsyncStorage = (): AsyncStoragePort => {
  if (STORAGE_MODE === 'indexeddb') return indexedDbAdapter;
  return {
    loadRecords: async () => localStorageAdapter.loadRecords(),
    loadGeneralTasks: async () => localStorageAdapter.loadGeneralTasks(),
    loadBookmarks: async () => localStorageAdapter.loadBookmarks(),
    loadBookmarkCategories: async () => localStorageAdapter.loadBookmarkCategories(),
    saveRecords: async (records) => localStorageAdapter.saveRecords(records),
    saveGeneralTasks: async (tasks) => localStorageAdapter.saveGeneralTasks(tasks),
    saveBookmarks: async (bookmarks) => localStorageAdapter.saveBookmarks(bookmarks),
    saveBookmarkCategories: async (categories) => localStorageAdapter.saveBookmarkCategories(categories),
  };
};
