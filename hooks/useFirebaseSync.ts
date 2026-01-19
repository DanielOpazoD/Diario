import { useEffect } from 'react';
import { subscribeToPatients } from '../services/firebaseService';
import useAppStore from '../stores/useAppStore';
import { auth } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const useFirebaseSync = () => {
    const setRecords = useAppStore((state) => state.setRecords);
    const addLog = (level: string, source: string, message: string) =>
        console.log(`[${level.toUpperCase()}] [${source}] ${message}`); // Simple logger fallback

    useEffect(() => {
        if (!auth) return;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                addLog('info', 'FirebaseSync', 'User authenticated, subscribing to patients...');

                const unsubscribePatients = subscribeToPatients((remotePatients) => {
                    addLog('info', 'FirebaseSync', `Received ${remotePatients.length} patients from Firebase`);

                    // Basic Sync Strategy: Trust Firebase as source of truth for now
                    // Ideally we would merge based on 'updatedAt' timestamps
                    if (remotePatients.length > 0) {
                        setRecords(remotePatients);
                    }
                });

                return () => {
                    unsubscribePatients();
                };
            } else {
                addLog('info', 'FirebaseSync', 'User not authenticated');
            }
        });

        return () => {
            unsubscribeAuth();
        };
    }, [setRecords]);
};

export default useFirebaseSync;
