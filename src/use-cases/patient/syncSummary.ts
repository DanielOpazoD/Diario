import type { PatientRecord } from '@shared/types';
import type { SyncChange } from '@use-cases/patientSyncMerge';
import { getPatientSyncStateSignature } from '@use-cases/patient/syncState';

export type SyncChangeCounts = {
  add: number;
  update: number;
  remove: number;
};

export const areRecordCollectionsEquivalent = (
  current: PatientRecord[],
  next: PatientRecord[]
): boolean => {
  if (current.length !== next.length) return false;
  const currentMap = new Map(current.map((record) => [record.id, getPatientSyncStateSignature(record)]));
  for (const record of next) {
    if (currentMap.get(record.id) !== getPatientSyncStateSignature(record)) return false;
  }
  return true;
};

export const countSyncChanges = (changes: SyncChange[]): SyncChangeCounts => changes.reduce(
  (acc, change) => {
    acc[change.type] += 1;
    return acc;
  },
  { add: 0, update: 0, remove: 0 } satisfies SyncChangeCounts
);

export const buildSyncSummaryText = (counts: SyncChangeCounts): string => {
  const summaryParts = [
    counts.add ? `Anadidos: ${counts.add}` : null,
    counts.update ? `Actualizados: ${counts.update}` : null,
    counts.remove ? `Eliminados: ${counts.remove}` : null,
  ].filter(Boolean);
  return summaryParts.join(' · ');
};

export const shouldApplyReconciledRecords = (
  current: PatientRecord[],
  next: PatientRecord[],
  hasChanges: boolean
): boolean => hasChanges && !areRecordCollectionsEquivalent(current, next);
