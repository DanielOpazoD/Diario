import type { AsyncStoragePort } from '@data/ports/storagePorts';
import type { PatientRecord, GeneralTask, Bookmark, BookmarkCategory } from '@shared/types';
import { INDEXED_DB } from '@shared/constants/indexedDb';
import { getKv, setKv } from '@services/indexedDb';

export const indexedDbAdapter: AsyncStoragePort = {
  loadRecords: async (): Promise<PatientRecord[]> =>
    (await getKv<PatientRecord[]>(INDEXED_DB.KEYS.RECORDS)) || [],
  loadGeneralTasks: async (): Promise<GeneralTask[]> =>
    (await getKv<GeneralTask[]>(INDEXED_DB.KEYS.TASKS)) || [],
  loadBookmarks: async (): Promise<Bookmark[]> =>
    (await getKv<Bookmark[]>(INDEXED_DB.KEYS.BOOKMARKS)) || [],
  loadBookmarkCategories: async (): Promise<BookmarkCategory[]> =>
    (await getKv<BookmarkCategory[]>(INDEXED_DB.KEYS.BOOKMARK_CATEGORIES)) || [],
  saveRecords: async (records) => {
    await setKv(INDEXED_DB.KEYS.RECORDS, records);
  },
  saveGeneralTasks: async (tasks) => {
    await setKv(INDEXED_DB.KEYS.TASKS, tasks);
  },
  saveBookmarks: async (bookmarks) => {
    await setKv(INDEXED_DB.KEYS.BOOKMARKS, bookmarks);
  },
  saveBookmarkCategories: async (categories) => {
    await setKv(INDEXED_DB.KEYS.BOOKMARK_CATEGORIES, categories);
  },
};
