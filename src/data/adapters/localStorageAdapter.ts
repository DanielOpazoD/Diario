import type { StoragePort } from '@data/ports/storagePort';
import {
  loadRecordsFromLocal,
  loadGeneralTasksFromLocal,
  loadBookmarksFromLocal,
  loadBookmarkCategoriesFromLocal,
  saveRecordsToLocal,
  saveGeneralTasksToLocal,
  saveBookmarksToLocal,
  saveBookmarkCategoriesToLocal,
} from '@services/storage';

export const localStorageAdapter: StoragePort = {
  loadRecords: loadRecordsFromLocal,
  loadGeneralTasks: loadGeneralTasksFromLocal,
  loadBookmarks: loadBookmarksFromLocal,
  loadBookmarkCategories: loadBookmarkCategoriesFromLocal,
  saveRecords: saveRecordsToLocal,
  saveGeneralTasks: saveGeneralTasksToLocal,
  saveBookmarks: saveBookmarksToLocal,
  saveBookmarkCategories: saveBookmarkCategoriesToLocal,
};
