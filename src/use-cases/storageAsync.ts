import { selectAsyncStorage } from '@data/adapters/storageProvider';

const storage = selectAsyncStorage();

export const loadRecordsAsync = () => storage.loadRecords();
export const loadGeneralTasksAsync = () => storage.loadGeneralTasks();
export const loadBookmarksAsync = () => storage.loadBookmarks();
export const loadBookmarkCategoriesAsync = () => storage.loadBookmarkCategories();

export const saveRecordsAsync = (records: Parameters<typeof storage.saveRecords>[0]) =>
  storage.saveRecords(records);
export const saveGeneralTasksAsync = (tasks: Parameters<typeof storage.saveGeneralTasks>[0]) =>
  storage.saveGeneralTasks(tasks);
export const saveBookmarksAsync = (bookmarks: Parameters<typeof storage.saveBookmarks>[0]) =>
  storage.saveBookmarks(bookmarks);
export const saveBookmarkCategoriesAsync = (categories: Parameters<typeof storage.saveBookmarkCategories>[0]) =>
  storage.saveBookmarkCategories(categories);
