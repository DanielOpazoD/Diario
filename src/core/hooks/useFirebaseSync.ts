
import { useEffect, useRef } from 'react';
import { PatientRecord } from '@shared/types';
import useAppStore from '@core/stores/useAppStore';
import { env } from '@shared/config/env';

const useFirebaseSync = () => {
    const setRecords = useAppStore((state) => state.setRecords);
    const addLog = (level: string, source: string, message: string) =>
        console.log(`[${level.toUpperCase()}] [${source}] ${message}`); // Simple logger fallback

    // Keep track of the patient subscription unsubscribe function
    const patientUnsubRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!env.flags.isFirebaseConfigured) return;
        let unsubscribeAuth: (() => void) | null = null;
        let isActive = true;

        const start = async () => {
            try {
                const { subscribeToAuthChanges } = await import('@use-cases/auth');
                if (!isActive) return;

                unsubscribeAuth = subscribeToAuthChanges((user) => {
                    if (patientUnsubRef.current) {
                        patientUnsubRef.current();
                        patientUnsubRef.current = null;
                    }

                    if (!user) {
                        addLog('info', 'FirebaseSync', 'User not authenticated');
                        return;
                    }

                    addLog('info', 'FirebaseSync', 'User authenticated, subscribing to patients...');

                    import('@use-cases/patientSync')
                        .then(({ subscribeToPatients }) => {
                            if (!isActive) return;
                            patientUnsubRef.current = subscribeToPatients((remotePatients) => {
                                const currentRecords = useAppStore.getState().records;
                                const now = Date.now();
                                const SYNC_GRACE_PERIOD = 30000; // Increased to 30s for slow networks

                                const remoteMap = new Map(remotePatients.map(p => [p.id, p]));
                                const updatedRecords: PatientRecord[] = [];
                                let hasChanges = false;
                                const logPrefix = `[Sync ${new Date().toLocaleTimeString()}]`;

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
                                        const localAge = now - (local.updatedAt || local.createdAt || now);

                                        if (localAge < SYNC_GRACE_PERIOD) {
                                            updatedRecords.push(local);
                                        } else {
                                            console.log(`${logPrefix} Removing local ${local.name} (Missing from cloud > 30s)`);
                                            hasChanges = true;
                                        }
                                    }
                                });

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
                        })
                        .catch(() => {
                            addLog('error', 'FirebaseSync', 'No se pudo cargar sincronización de pacientes.');
                        });
                });
            } catch {
                addLog('error', 'FirebaseSync', 'No se pudo cargar Firebase.');
            }
        };

        start();

        return () => {
            isActive = false;
            if (unsubscribeAuth) {
                unsubscribeAuth();
            }
            if (patientUnsubRef.current) {
                patientUnsubRef.current();
                patientUnsubRef.current = null;
            }
        };
    }, [setRecords]);
};

export default useFirebaseSync;
