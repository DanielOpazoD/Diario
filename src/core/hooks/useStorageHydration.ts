import { useEffect, useRef } from 'react';
import { normalizePatientRecords } from '@domain/patient/normalize';
import { ensureDefaultCategories } from '@domain/bookmarks';
import { STORAGE_PREFER_INDEXEDDB_READ, STORAGE_VERIFY_ON_READ } from '@shared/config/storageConfig';
import { loadBookmarkCategoriesFromLocal } from '@use-cases/storage';
import { loadBookmarkCategoriesAsync, loadBookmarksAsync, loadGeneralTasksAsync, loadRecordsAsync } from '@use-cases/storageAsync';
import { verifyIndexedDbMatchesLocal } from '@use-cases/storageIndexedDb';
import { useAppActions } from '@core/app/state/useAppActions';

type AddLog = (level: 'info' | 'warn' | 'error', source: string, message: string, details?: any) => void;

const ensureCategories = (categories: ReturnType<typeof loadBookmarkCategoriesFromLocal>) =>
  ensureDefaultCategories(categories);

export const useStorageHydration = (addLog: AddLog) => {
  const hasRun = useRef(false);
  const { setRecords, setGeneralTasks, setBookmarks, setBookmarkCategories } = useAppActions();

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    if (!STORAGE_PREFER_INDEXEDDB_READ) return;

    (async () => {
      try {
        if (STORAGE_VERIFY_ON_READ) {
          const verification = await verifyIndexedDbMatchesLocal();
          const allMatch = Object.values(verification).every(Boolean);
          if (!allMatch) {
            addLog('warn', 'Storage', 'IndexedDB verification failed; skipping hydration', verification);
            return;
          }
        }

        const [records, tasks, bookmarks, categories] = await Promise.all([
          loadRecordsAsync(),
          loadGeneralTasksAsync(),
          loadBookmarksAsync(),
          loadBookmarkCategoriesAsync(),
        ]);

        setRecords(normalizePatientRecords(records));
        setGeneralTasks(tasks);
        setBookmarks(bookmarks);
        setBookmarkCategories(ensureCategories(categories));
        addLog('info', 'Storage', 'Hydrated state from IndexedDB');
      } catch (error) {
        addLog('error', 'Storage', 'Failed to hydrate from IndexedDB', { error: String(error) });
      }
    })();
  }, [addLog, setRecords, setGeneralTasks, setBookmarks, setBookmarkCategories]);
};
