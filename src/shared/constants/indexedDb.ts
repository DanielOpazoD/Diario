export const INDEXED_DB = {
  NAME: 'medidiario-db',
  VERSION: 1,
  STORES: {
    KV: 'kv',
    META: 'meta',
  },
  KEYS: {
    RECORDS: 'records',
    TASKS: 'tasks',
    BOOKMARKS: 'bookmarks',
    BOOKMARK_CATEGORIES: 'bookmark_categories',
  },
  META_KEYS: {
    MIGRATED_AT: 'migrated_at',
    MIGRATION_VERSION: 'migration_version',
    DATA_VERSION: 'data_version',
  },
} as const;
