
import { useEffect, useRef } from 'react';
import useAppStore from '@core/stores/useAppStore';
import type { PatientRecord } from '@shared/types';
import { env } from '@shared/config/env';
import { SYNC_POLICY } from '@shared/config/syncPolicy';
import { logEvent } from '@use-cases/logger';
import { listPatientFiles } from '@use-cases/attachments';
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
    const recoveryInFlightRef = useRef<Set<string>>(new Set());
    const recoveryAttemptedAtRef = useRef<Map<string, number>>(new Map());

    const RECOVERY_RETRY_MS = 120000;

    const findSiblingFilesByRut = (target: PatientRecord, allRecords: PatientRecord[]) => {
        const targetRut = target.rut.trim().toLowerCase();
        if (!targetRut) return [];

        const siblingRecords = allRecords.filter((record) => (
            record.id !== target.id &&
            record.rut.trim().toLowerCase() === targetRut &&
            (record.attachedFiles?.length ?? 0) > 0
        ));

        const merged = siblingRecords.flatMap((record) => record.attachedFiles || []);
        const byId = new Map<string, typeof merged[number]>();
        merged.forEach((file) => {
            if (!byId.has(file.id)) {
                byId.set(file.id, file);
            }
        });
        return Array.from(byId.values());
    };

    const recoverMissingAttachments = async (records: PatientRecord[]) => {
        const now = Date.now();
        const recoverable = records
            .filter((record) => (record.attachedFiles?.length ?? 0) === 0)
            .filter((record) => !recoveryInFlightRef.current.has(record.id))
            .filter((record) => {
                const attemptedAt = recoveryAttemptedAtRef.current.get(record.id) || 0;
                return now - attemptedAt > RECOVERY_RETRY_MS;
            });

        if (recoverable.length === 0) return;
        recoverable.forEach((record) => {
            recoveryInFlightRef.current.add(record.id);
            recoveryAttemptedAtRef.current.set(record.id, now);
        });

        const recoveredById = new Map<string, PatientRecord>();

        await Promise.all(recoverable.map(async (record) => {
            try {
                const filesFromStorage = await listPatientFiles(record.id);
                const files = filesFromStorage.length > 0
                    ? filesFromStorage
                    : findSiblingFilesByRut(record, records);
                if (files.length === 0) return;
                recoveredById.set(record.id, {
                    ...record,
                    attachedFiles: files,
                    updatedAt: Math.max(record.updatedAt ?? 0, Date.now()),
                });
            } catch {
                // no-op; per-record cleanup runs in finally
            } finally {
                recoveryInFlightRef.current.delete(record.id);
            }
        }));

        if (recoveredById.size === 0) return;

        const latestRecords = useAppStore.getState().records;
        const nextRecords = latestRecords.map((record) => recoveredById.get(record.id) || record);
        setRecords(nextRecords);

        logEvent(
            'info',
            'FirebaseSync',
            `Adjuntos recuperados desde Storage para ${recoveredById.size} paciente(s)`,
            {
                recoveredPatients: recoveredById.size,
            }
        );
    };

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

                                const recordsForRecovery = shouldUpdate ? records : currentRecords;
                                void recoverMissingAttachments(recordsForRecovery);
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
