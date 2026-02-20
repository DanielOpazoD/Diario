import useAppStartup from '@core/hooks/useAppStartup';
import { useStorageHydration } from '@core/hooks/useStorageHydration';
import { useStorageMigration } from '@core/hooks/useStorageMigration';
import useFirebaseSync from '@core/hooks/useFirebaseSync';
import { useLogger } from '@core/context/LogContext';

/**
 * Encapsulates the global initialization logic of the application.
 * - Restores persistence.
 * - Handles data scheme migrations.
 * - Verifies/Synchronizes Firebase connection.
 * - Injects application-level logging capabilities.
 */
export const useAppBootstrap = () => {
    const { addLog } = useLogger();

    // Application Lifecycle
    useAppStartup(addLog);
    useStorageMigration(addLog);
    useStorageHydration(addLog);

    // Remote persistence synchronization
    useFirebaseSync();
};
