export type StorageMode = 'local' | 'indexeddb';

export const STORAGE_MODE: StorageMode = 'local';
export const STORAGE_SHADOW_WRITE = false;
export const STORAGE_VERIFY_ON_READ = false;
export const STORAGE_PREFER_INDEXEDDB_READ = false;
export const STORAGE_AUTO_MIGRATE = true;
export const STORAGE_AUTO_VERIFY = true;
export const STORAGE_MIGRATION_VERSION = 1;
