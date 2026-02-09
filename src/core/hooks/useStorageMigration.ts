import { useEffect, useRef } from 'react';
import { STORAGE_AUTO_MIGRATE, STORAGE_AUTO_VERIFY } from '@shared/config/storageConfig';
import { getIndexedDbMigrationMeta, hasIndexedDbMigration, migrateLocalStorageToIndexedDb, verifyIndexedDbMatchesLocal } from '@use-cases/storageIndexedDb';

type AddLog = (level: 'info' | 'warn' | 'error', source: string, message: string, details?: any) => void;

export const useStorageMigration = (addLog: AddLog) => {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    if (!STORAGE_AUTO_MIGRATE) return;

    (async () => {
      try {
        const alreadyMigrated = await hasIndexedDbMigration();
        if (!alreadyMigrated) {
          await migrateLocalStorageToIndexedDb();
          const meta = await getIndexedDbMigrationMeta();
          addLog('info', 'Storage', 'IndexedDB migration completed', meta);
        }

        if (STORAGE_AUTO_VERIFY) {
          const verification = await verifyIndexedDbMatchesLocal();
          const allMatch = Object.values(verification).every(Boolean);
          addLog(allMatch ? 'info' : 'warn', 'Storage', 'IndexedDB verification result', verification);
        }
      } catch (error) {
        addLog('error', 'Storage', 'IndexedDB migration failed', { error: String(error) });
      }
    })();
  }, [addLog]);
};
