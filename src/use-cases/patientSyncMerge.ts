import type { PatientRecord } from '@shared/types';

export type SyncChangeType = 'update' | 'remove' | 'add';

export interface SyncChange {
  type: SyncChangeType;
  id: string;
}

export interface SyncMergeResult {
  records: PatientRecord[];
  hasChanges: boolean;
  changes: SyncChange[];
}

export const reconcilePatientRecords = (
  localRecords: PatientRecord[],
  remoteRecords: PatientRecord[],
  now: number,
  gracePeriodMs: number
): SyncMergeResult => {
  const remoteMap = new Map(remoteRecords.map((patient) => [patient.id, patient]));
  const updatedRecords: PatientRecord[] = [];
  const changes: SyncChange[] = [];

  localRecords.forEach((local) => {
    const remote = remoteMap.get(local.id);

    if (remote) {
      const localUpdate = local.updatedAt || 0;
      const remoteUpdate = remote.updatedAt || 0;

      if (remoteUpdate > localUpdate) {
        updatedRecords.push(remote);
        changes.push({ type: 'update', id: local.id });
      } else {
        updatedRecords.push(local);
      }
    } else {
      const localAge = now - (local.updatedAt || local.createdAt || now);

      if (localAge < gracePeriodMs) {
        updatedRecords.push(local);
      } else {
        changes.push({ type: 'remove', id: local.id });
      }
    }
  });

  const localIds = new Set(localRecords.map((patient) => patient.id));
  remoteRecords.forEach((remote) => {
    if (!localIds.has(remote.id)) {
      updatedRecords.push(remote);
      changes.push({ type: 'add', id: remote.id });
    }
  });

  return {
    records: updatedRecords,
    hasChanges: changes.length > 0,
    changes,
  };
};
