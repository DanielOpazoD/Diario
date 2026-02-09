import { indexedDbAdapter } from '@data/adapters/indexedDbAdapter';
import { loadRecordsFromLocal, loadGeneralTasksFromLocal, loadBookmarksFromLocal, loadBookmarkCategoriesFromLocal } from '@use-cases/storage';
import { INDEXED_DB } from '@shared/constants/indexedDb';
import { clearKv, clearMeta, getMeta, setMeta } from '@services/indexedDb';
import { STORAGE_KEYS } from '@shared/constants/storageKeys';
import { safeGetItem } from '@shared/utils/safeStorage';
import { STORAGE_MIGRATION_VERSION } from '@shared/config/storageConfig';

export const migrateLocalStorageToIndexedDb = async () => {
  const [records, tasks, bookmarks, categories] = [
    loadRecordsFromLocal(),
    loadGeneralTasksFromLocal(),
    loadBookmarksFromLocal(),
    loadBookmarkCategoriesFromLocal(),
  ];

  await indexedDbAdapter.saveRecords(records);
  await indexedDbAdapter.saveGeneralTasks(tasks);
  await indexedDbAdapter.saveBookmarks(bookmarks);
  await indexedDbAdapter.saveBookmarkCategories(categories);

  const dataVersion = safeGetItem(STORAGE_KEYS.DATA_VERSION);
  await setMeta(INDEXED_DB.META_KEYS.MIGRATED_AT, Date.now());
  await setMeta(INDEXED_DB.META_KEYS.MIGRATION_VERSION, String(STORAGE_MIGRATION_VERSION));
  if (dataVersion) {
    await setMeta(INDEXED_DB.META_KEYS.DATA_VERSION, dataVersion);
  }
};

export const getIndexedDbMigrationMeta = async () => {
  const [migratedAt, migrationVersion] = await Promise.all([
    getMeta<number>(INDEXED_DB.META_KEYS.MIGRATED_AT),
    getMeta<string>(INDEXED_DB.META_KEYS.MIGRATION_VERSION),
  ]);
  const dataVersion = await getMeta<string>(INDEXED_DB.META_KEYS.DATA_VERSION);
  return { migratedAt, migrationVersion, dataVersion };
};

export const hasIndexedDbMigration = async () => {
  const meta = await getIndexedDbMigrationMeta();
  return typeof meta.migratedAt === 'number';
};

const computeHash = (value: unknown) => JSON.stringify(value);

export type IndexedDbVerification = {
  records: boolean;
  tasks: boolean;
  bookmarks: boolean;
  bookmarkCategories: boolean;
};

export const verifyIndexedDbMatchesLocal = async (): Promise<IndexedDbVerification> => {
  const [localRecords, localTasks, localBookmarks, localCategories] = [
    loadRecordsFromLocal(),
    loadGeneralTasksFromLocal(),
    loadBookmarksFromLocal(),
    loadBookmarkCategoriesFromLocal(),
  ];
  const [dbRecords, dbTasks, dbBookmarks, dbCategories] = await Promise.all([
    indexedDbAdapter.loadRecords(),
    indexedDbAdapter.loadGeneralTasks(),
    indexedDbAdapter.loadBookmarks(),
    indexedDbAdapter.loadBookmarkCategories(),
  ]);

  return {
    records: computeHash(localRecords) === computeHash(dbRecords),
    tasks: computeHash(localTasks) === computeHash(dbTasks),
    bookmarks: computeHash(localBookmarks) === computeHash(dbBookmarks),
    bookmarkCategories: computeHash(localCategories) === computeHash(dbCategories),
  };
};

export const resetIndexedDb = async () => {
  await clearKv();
  await clearMeta();
};
