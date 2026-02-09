
import { useEffect, useRef } from 'react';
import { PatientRecord } from '@shared/types';
import useAppStore from '@core/stores/useAppStore';
import { env } from '@shared/config/env';
import { logEvent } from '@use-cases/logger';
import { reconcilePatientRecords } from '@use-cases/patientSyncMerge';
import { subscribeToPatients } from '@use-cases/patientSync';

const useFirebaseSync = () => {
    const setRecords = useAppStore((state) => state.setRecords);
    const addLog = (level: 'info' | 'warn' | 'error', source: string, message: string) =>
        logEvent(level, source, message);

    const areRecordsEquivalent = (current: PatientRecord[], next: PatientRecord[]) => {
        if (current.length !== next.length) return false;
        const currentMap = new Map(current.map((record) => [
            record.id,
            { updatedAt: record.updatedAt || 0, createdAt: record.createdAt || 0 },
        ]));
        for (const record of next) {
            const existing = currentMap.get(record.id);
            if (!existing) return false;
            if (existing.updatedAt !== (record.updatedAt || 0)) return false;
            if (existing.createdAt !== (record.createdAt || 0)) return false;
        }
        return true;
    };

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

                    if (!isActive) return;
                    patientUnsubRef.current = subscribeToPatients((remotePatients) => {
                                const startedAt = Date.now();
                                const currentRecords = useAppStore.getState().records;
                                const now = Date.now();
                                const SYNC_GRACE_PERIOD = 30000; // Increased to 30s for slow networks
                                const logPrefix = `[Sync ${new Date().toLocaleTimeString()}]`;

                                const { records, hasChanges, changes } = reconcilePatientRecords(
                                    currentRecords,
                                    remotePatients,
                                    now,
                                    SYNC_GRACE_PERIOD
                                );

                                const shouldUpdate = hasChanges && !areRecordsEquivalent(currentRecords, records);

                                if (shouldUpdate && changes.length > 0) {
                                    const counts = changes.reduce(
                                        (acc, change) => {
                                            acc[change.type] += 1;
                                            return acc;
                                        },
                                        { add: 0, update: 0, remove: 0 }
                                    );

                                    const summaryParts = [
                                        counts.add ? `Añadidos: ${counts.add}` : null,
                                        counts.update ? `Actualizados: ${counts.update}` : null,
                                        counts.remove ? `Eliminados: ${counts.remove}` : null,
                                    ].filter(Boolean);

                                    logEvent(
                                        'info',
                                        'FirebaseSync',
                                        `${logPrefix} Cambios sincronizados — ${summaryParts.join(' · ')}`,
                                        {
                                            addCount: counts.add,
                                            updateCount: counts.update,
                                            removeCount: counts.remove,
                                            localCount: currentRecords.length,
                                            remoteCount: remotePatients.length,
                                            durationMs: Math.max(0, Date.now() - startedAt),
                                        }
                                    );
                                }

                                if (shouldUpdate) {
                                    setRecords(records);
                                }
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
