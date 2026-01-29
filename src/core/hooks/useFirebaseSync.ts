
import { useEffect, useRef } from 'react';
import { subscribeToAuthChanges } from '@use-cases/auth';
import { PatientRecord } from '@shared/types';
import useAppStore from '@core/stores/useAppStore';
import { subscribeToPatients } from '@use-cases/patientSync';

const useFirebaseSync = () => {
    const setRecords = useAppStore((state) => state.setRecords);
    const addLog = (level: string, source: string, message: string) =>
        console.log(`[${level.toUpperCase()}] [${source}] ${message}`); // Simple logger fallback

    // Keep track of the patient subscription unsubscribe function
    const patientUnsubRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        const unsubscribeAuth = subscribeToAuthChanges((user) => {
            // Clean up previous patient subscription if any
            if (patientUnsubRef.current) {
                patientUnsubRef.current();
                patientUnsubRef.current = null;
            }

            if (user) {
                addLog('info', 'FirebaseSync', 'User authenticated, subscribing to patients...');

                patientUnsubRef.current = subscribeToPatients((remotePatients) => {
                    const currentRecords = useAppStore.getState().records;
                    const now = Date.now();
                    const SYNC_GRACE_PERIOD = 30000; // Increased to 30s for slow networks

                    // 1. Build a map of remote patients for O(1) lookups
                    const remoteMap = new Map(remotePatients.map(p => [p.id, p]));

                    // 2. Bidirectional Merge
                    const updatedRecords: PatientRecord[] = [];
                    let hasChanges = false;
                    const logPrefix = `[Sync ${new Date().toLocaleTimeString()}]`;

                    // Check Current Local Records: Keep, Update, or Remove?
                    currentRecords.forEach(local => {
                        const remote = remoteMap.get(local.id);

                        if (remote) {
                            const localUpdate = local.updatedAt || 0;
                            const remoteUpdate = remote.updatedAt || 0;

                            if (remoteUpdate > localUpdate) {
                                console.log(`${logPrefix} Updating local ${local.name} (Remote is newer)`);
                                updatedRecords.push(remote);
                                hasChanges = true;
                            } else {
                                updatedRecords.push(local);
                            }
                        } else {
                            // Record is in Local but NOT in Remote
                            const localAge = now - (local.updatedAt || local.createdAt || now);

                            if (localAge < SYNC_GRACE_PERIOD) {
                                // Keep it, it might still be syncing to cloud
                                updatedRecords.push(local);
                            } else {
                                // It should have synced by now. If it's missing from cloud, it was deleted elsewhere.
                                console.log(`${logPrefix} Removing local ${local.name} (Missing from cloud > 30s)`);
                                hasChanges = true;
                            }
                        }
                    });

                    // Add Remote Records that are not in Local
                    const localIds = new Set(currentRecords.map(p => p.id));
                    remotePatients.forEach(remote => {
                        if (!localIds.has(remote.id)) {
                            console.log(`${logPrefix} Adding remote ${remote.name} (New from cloud)`);
                            updatedRecords.push(remote);
                            hasChanges = true;
                        }
                    });

                    if (hasChanges) {
                        setRecords(updatedRecords);
                    }
                });
            } else {
                addLog('info', 'FirebaseSync', 'User not authenticated');
                // Could verify if we need to clear records on logout, but usually we just stop syncing.
                // setRecords([]); 
            }
        });

        // Cleanup function for the effect
        return () => {
            // Unsubscribe from Auth updates
            unsubscribeAuth();

            // Unsubscribe from Patient updates if active
            if (patientUnsubRef.current) {
                patientUnsubRef.current();
                patientUnsubRef.current = null;
            }
        };
    }, [setRecords]);
};

export default useFirebaseSync;
