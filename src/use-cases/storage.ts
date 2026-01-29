import { localStorageAdapter } from '@data/adapters/localStorageAdapter';

export const loadRecordsFromLocal = localStorageAdapter.loadRecords;
export const loadGeneralTasksFromLocal = localStorageAdapter.loadGeneralTasks;
export const loadBookmarksFromLocal = localStorageAdapter.loadBookmarks;
export const loadBookmarkCategoriesFromLocal = localStorageAdapter.loadBookmarkCategories;

export const saveRecordsToLocal = localStorageAdapter.saveRecords;
export const saveGeneralTasksToLocal = localStorageAdapter.saveGeneralTasks;
export const saveBookmarksToLocal = localStorageAdapter.saveBookmarks;
export const saveBookmarkCategoriesToLocal = localStorageAdapter.saveBookmarkCategories;
