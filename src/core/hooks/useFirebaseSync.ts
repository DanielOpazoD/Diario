
import { useEffect, useRef } from 'react';
import { subscribeToPatients } from '@services/firebaseService';
import { subscribeToAuthChanges } from '@services/authService';
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
                    addLog('info', 'FirebaseSync', `Received ${remotePatients.length} patients from Firebase`);

                    const currentRecords = useAppStore.getState().records;

                    // Intelligent Merge: For each remote patient, only update if it's newer than local
                    const mergedRecords = [...currentRecords];
                    let hasChanges = false;

                    remotePatients.forEach(remote => {
                        const localIndex = mergedRecords.findIndex(p => p.id === remote.id);
                        if (localIndex === -1) {
                            // New patient from remote
                            mergedRecords.push(remote);
                            hasChanges = true;
                        } else {
                            const local = mergedRecords[localIndex];
                            const remoteUpdate = remote.updatedAt || 0;
                            const localUpdate = local.updatedAt || 0;

                            if (remoteUpdate > localUpdate) {
                                // Remote is newer
                                mergedRecords[localIndex] = remote;
                                hasChanges = true;
                            }
                        }
                    });

                    // Remove local records not in remote (if you want full sync)
                    // Keep this with caution, usually we want to keep what's in Firebase.
                    // But if we deleted locally, we already manage pendingDeletions.

                    if (hasChanges) {
                        setRecords(mergedRecords);
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
