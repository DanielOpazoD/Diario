import { INDEXED_DB } from '@shared/constants/indexedDb';

type KvEntry<T = unknown> = {
  key: string;
  value: T;
  updatedAt: number;
};

const ensureDbAvailable = () => {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available in this environment.');
  }
};

const openDb = (): Promise<IDBDatabase> => {
  ensureDbAvailable();
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXED_DB.NAME, INDEXED_DB.VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(INDEXED_DB.STORES.KV)) {
        db.createObjectStore(INDEXED_DB.STORES.KV, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(INDEXED_DB.STORES.META)) {
        db.createObjectStore(INDEXED_DB.STORES.META, { keyPath: 'key' });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

const withStore = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = fn(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getKv = async <T>(key: string): Promise<T | null> => {
  const result = await withStore<KvEntry<T> | undefined>(
    INDEXED_DB.STORES.KV,
    'readonly',
    (store) => store.get(key)
  );
  return result ? result.value : null;
};

export const setKv = async <T>(key: string, value: T) => {
  const entry: KvEntry<T> = { key, value, updatedAt: Date.now() };
  await withStore(INDEXED_DB.STORES.KV, 'readwrite', (store) => store.put(entry));
};

export const clearKv = async () => {
  await withStore(INDEXED_DB.STORES.KV, 'readwrite', (store) => store.clear());
};

export const getMeta = async <T>(key: string): Promise<T | null> => {
  const result = await withStore<KvEntry<T> | undefined>(
    INDEXED_DB.STORES.META,
    'readonly',
    (store) => store.get(key)
  );
  return result ? result.value : null;
};

export const setMeta = async <T>(key: string, value: T) => {
  const entry: KvEntry<T> = { key, value, updatedAt: Date.now() };
  await withStore(INDEXED_DB.STORES.META, 'readwrite', (store) => store.put(entry));
};

export const clearMeta = async () => {
  await withStore(INDEXED_DB.STORES.META, 'readwrite', (store) => store.clear());
};
