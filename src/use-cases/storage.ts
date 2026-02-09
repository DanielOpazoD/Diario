import { selectSyncStorage } from '@data/adapters/storageProvider';
import { storageAdapter } from '@data/adapters/storageAdapter';

const storage = selectSyncStorage();

export const loadRecordsFromLocal = storage.loadRecords;
export const loadGeneralTasksFromLocal = storage.loadGeneralTasks;
export const loadBookmarksFromLocal = storage.loadBookmarks;
export const loadBookmarkCategoriesFromLocal = storage.loadBookmarkCategories;

export const saveRecordsToLocal = storage.saveRecords;
export const saveGeneralTasksToLocal = storage.saveGeneralTasks;
export const saveBookmarksToLocal = storage.saveBookmarks;
export const saveBookmarkCategoriesToLocal = storage.saveBookmarkCategories;

export const clearStorage = storageAdapter.clearStorage;
export const downloadBackupAsJson = storageAdapter.downloadBackupAsJson;
export const parseBackupFile = storageAdapter.parseBackupFile;
