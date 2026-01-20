
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

                    // Basic Sync Strategy: Trust Firebase as source of truth for now
                    if (remotePatients.length > 0) {
                        setRecords(remotePatients);
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
