
import { useEffect, useRef } from 'react';
import useAppStore from '@core/stores/useAppStore';
import { env } from '@shared/config/env';
import { SYNC_POLICY } from '@shared/config/syncPolicy';
import { logEvent } from '@use-cases/logger';
import { reconcilePatientRecords } from '@use-cases/patientSyncMerge';
import { subscribeToPatients } from '@use-cases/patientSync';
import {
    buildSyncSummaryText,
    countSyncChanges,
    shouldApplyReconciledRecords,
} from '@use-cases/patient/syncSummary';

const useFirebaseSync = () => {
    const setRecords = useAppStore((state) => state.setRecords);
    const addLog = (level: 'info' | 'warn' | 'error', source: string, message: string) =>
        logEvent(level, source, message);

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
                                const logPrefix = `[Sync ${new Date().toLocaleTimeString()}]`;

                                const { records, hasChanges, changes, stats } = reconcilePatientRecords(
                                    currentRecords,
                                    remotePatients,
                                    now,
                                    SYNC_POLICY.mergeGracePeriodMs,
                                    SYNC_POLICY.conflictPolicy
                                );

                                const shouldUpdate = shouldApplyReconciledRecords(currentRecords, records, hasChanges);

                                if (shouldUpdate && changes.length > 0) {
                                    const counts = countSyncChanges(changes);

                                    logEvent(
                                        'info',
                                        'FirebaseSync',
                                        `${logPrefix} Cambios sincronizados — ${buildSyncSummaryText(counts)}`,
                                        {
                                            addCount: counts.add,
                                            updateCount: counts.update,
                                            removeCount: counts.remove,
                                            conflictCount: stats.conflicts,
                                            protectedRemovals: stats.protectedRemovals,
                                            localCount: currentRecords.length,
                                            remoteCount: remotePatients.length,
                                            durationMs: Math.max(0, Date.now() - startedAt),
                                        }
                                    );
                                }

                                if (stats.protectedRemovals > 0) {
                                    logEvent(
                                        'warn',
                                        'FirebaseSync',
                                        `${logPrefix} Proteccion de borrado masivo activada`,
                                        {
                                            protectedRemovals: stats.protectedRemovals,
                                            localCount: currentRecords.length,
                                            remoteCount: remotePatients.length,
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
