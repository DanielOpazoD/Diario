
import { useEffect, useRef } from 'react';
import { subscribeToPatients } from '@services/firebaseService';
import { subscribeToAuthChanges } from '@services/authService';
import { PatientRecord } from '@shared/types';
import useAppStore from '@core/stores/useAppStore';

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
                    const SYNC_GRACE_PERIOD = 10000; // 10 seconds

                    // 1. Build a map of remote patients for O(1) lookups
                    const remoteMap = new Map(remotePatients.map(p => [p.id, p]));

                    // 2. Bidirectional Merge
                    const updatedRecords: PatientRecord[] = [];
                    let hasChanges = false;

                    // Check Current Local Records: Keep, Update, or Remove?
                    currentRecords.forEach(local => {
                        const remote = remoteMap.get(local.id);

                        if (remote) {
                            const localUpdate = local.updatedAt || 0;
                            const remoteUpdate = remote.updatedAt || 0;

                            if (remoteUpdate > localUpdate) {
                                updatedRecords.push(remote);
                                hasChanges = true;
                            } else {
                                updatedRecords.push(local);
                            }
                        } else {
                            // Record is in Local but NOT in Remote
                            // Was it recently created/modified locally?
                            const localAge = now - (local.updatedAt || local.createdAt || now);

                            if (localAge < SYNC_GRACE_PERIOD) {
                                // Keep it, it might still be syncing to cloud
                                updatedRecords.push(local);
                            } else {
                                // It should have synced by now. If it's missing from cloud, it was deleted elsewhere.
                                hasChanges = true;
                                // skip adding to updatedRecords (effectively removing it)
                            }
                        }
                    });

                    // Add Remote Records that are not in Local
                    const localIds = new Set(currentRecords.map(p => p.id));
                    remotePatients.forEach(remote => {
                        if (!localIds.has(remote.id)) {
                            updatedRecords.push(remote);
                            hasChanges = true;
                        }
                    });

                    if (hasChanges) {
                        addLog('info', 'FirebaseSync', `Syncing changes: ${currentRecords.length} -> ${updatedRecords.length} patients`);
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
