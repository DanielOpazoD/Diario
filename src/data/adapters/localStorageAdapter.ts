import type { LocalStoragePort } from '@data/ports/storagePorts';
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

export const localStorageAdapter: LocalStoragePort = {
  loadRecords: loadRecordsFromLocal,
  loadGeneralTasks: loadGeneralTasksFromLocal,
  loadBookmarks: loadBookmarksFromLocal,
  loadBookmarkCategories: loadBookmarkCategoriesFromLocal,
  saveRecords: saveRecordsToLocal,
  saveGeneralTasks: saveGeneralTasksToLocal,
  saveBookmarks: saveBookmarksToLocal,
  saveBookmarkCategories: saveBookmarkCategoriesToLocal,
};
